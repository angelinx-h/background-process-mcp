import stripAnsi from 'strip-ansi';
import { WebSocketServer as Server } from 'ws';
import { ProcessManager } from './ProcessManager.js';
import { ClientMessageSchema } from '../types/index.js';
import { getPackageInfo } from '../utils/packageInfo.js';
const OUTPUT_BATCH_INTERVAL_MS = 50;
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds
const IDLE_SHUTDOWN_TIMEOUT_MS = 30 * 1000; // 30 seconds
class WebSocketServer {
    wss;
    processManager;
    outputBuffers = new Map();
    packageVersion = 'unknown';
    heartbeatInterval = null;
    shutdownTimeout = null;
    constructor(port) {
        this.wss = new Server({ port });
        const events = {
            onProcessStarted: (process) => {
                this.broadcast({ action: 'server.process_started', process });
            },
            onProcessOutput: (processId, data) => {
                const buffer = this.outputBuffers.get(processId) ?? '';
                this.outputBuffers.set(processId, buffer + data);
            },
            onProcessStopped: (processId) => {
                this.flushOutputBuffer(processId);
                this.outputBuffers.delete(processId);
                const finalProcessState = this.processManager.getProcess(processId);
                if (finalProcessState) {
                    this.broadcast({
                        action: 'server.process_stopped',
                        process: finalProcessState,
                    });
                }
            },
        };
        this.processManager = new ProcessManager(events);
        this.setupConnectionHandler();
        this.loadPackageVersion();
        this.setupHeartbeat();
        setInterval(() => this.flushAllOutputBuffers(), OUTPUT_BATCH_INTERVAL_MS);
        const cleanupAndExit = this.shutdown.bind(this);
        process.on('SIGINT', cleanupAndExit);
        process.on('SIGTERM', cleanupAndExit);
    }
    async shutdown() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.cancelShutdownTimer();
        this.wss.close();
        await ProcessManager.globalCleanup();
        // eslint-disable-next-line n/no-process-exit
        process.exit(0);
    }
    async loadPackageVersion() {
        try {
            const packageInfo = await getPackageInfo();
            this.packageVersion = packageInfo.version ?? 'unknown';
        }
        catch {
            // Gracefully fail, version will remain 'unknown'
        }
    }
    setupConnectionHandler() {
        this.wss.on('connection', (ws) => {
            this.cancelShutdownTimer();
            // eslint-disable-next-line no-param-reassign
            ws.isAlive = true;
            ws.on('pong', () => {
                // eslint-disable-next-line no-param-reassign
                ws.isAlive = true;
            });
            this.sendFullState(ws);
            ws.on('message', (message) => {
                this.handleMessage(ws, message);
            });
            ws.on('close', () => {
                this.checkIdle();
            });
        });
    }
    setupHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                const extWs = ws;
                if (!extWs.isAlive) {
                    extWs.terminate();
                    return;
                }
                extWs.isAlive = false;
                extWs.ping();
            });
        }, HEARTBEAT_INTERVAL_MS);
    }
    checkIdle() {
        if (this.wss.clients.size === 0) {
            this.startShutdownTimer();
        }
    }
    startShutdownTimer() {
        if (this.shutdownTimeout)
            return;
        this.shutdownTimeout = setTimeout(async () => this.shutdown(), IDLE_SHUTDOWN_TIMEOUT_MS);
    }
    cancelShutdownTimer() {
        if (this.shutdownTimeout) {
            clearTimeout(this.shutdownTimeout);
            this.shutdownTimeout = null;
        }
    }
    handleMessage(ws, message) {
        try {
            const rawMessage = JSON.parse(message.toString());
            const parsedMessage = ClientMessageSchema.parse(rawMessage);
            const sendResponse = (success, error, data) => {
                const response = {
                    action: 'server.request_response',
                    requestId: parsedMessage.requestId,
                    success,
                    error,
                    data,
                };
                ws.send(JSON.stringify(response));
            };
            switch (parsedMessage.action) {
                case 'client.start_process': {
                    try {
                        const processState = this.processManager.startProcess(parsedMessage.command);
                        sendResponse(true, undefined, processState);
                    }
                    catch (e) {
                        sendResponse(false, e.message);
                    }
                    break;
                }
                case 'client.stop_process': {
                    try {
                        this.processManager.stopProcess(parsedMessage.processId);
                        sendResponse(true);
                    }
                    catch (e) {
                        sendResponse(false, e.message);
                    }
                    break;
                }
                case 'client.clear_process': {
                    try {
                        this.processManager.clearProcess(parsedMessage.processId);
                        sendResponse(true);
                        this.broadcast({
                            action: 'server.process_cleared',
                            processId: parsedMessage.processId,
                        });
                    }
                    catch (e) {
                        sendResponse(false, e.message);
                    }
                    break;
                }
                case 'client.request_output': {
                    const output = this.processManager.getProcessOutput(parsedMessage.processId, {
                        head: parsedMessage.head,
                        tail: parsedMessage.tail,
                    });
                    if (output) {
                        const response = {
                            action: 'server.output_response',
                            requestId: parsedMessage.requestId,
                            processId: parsedMessage.processId,
                            output,
                        };
                        ws.send(JSON.stringify(response));
                    }
                    break;
                }
                case 'client.request_status': {
                    const statusResponse = {
                        action: 'server.status_response',
                        requestId: parsedMessage.requestId,
                        version: this.packageVersion,
                        port: this.wss.options.port ?? 0,
                        pid: process.pid,
                        uptime: process.uptime(),
                        processCounts: this.processManager.getProcessCounts(),
                    };
                    ws.send(JSON.stringify(statusResponse));
                    break;
                }
                case 'client.list_processes': {
                    const processes = this.processManager.getAllProcesses();
                    const response = {
                        action: 'server.list_processes_response',
                        requestId: parsedMessage.requestId,
                        processes,
                    };
                    ws.send(JSON.stringify(response));
                    break;
                }
                default: {
                    // TODO: Handle unknown action
                    break;
                }
            }
        }
        catch {
            // TODO: Handle message parsing error
        }
    }
    sendFullState(ws) {
        const processes = this.processManager.getAllProcesses();
        const message = {
            action: 'server.full_state',
            processes,
        };
        ws.send(JSON.stringify(message));
    }
    flushOutputBuffer(processId) {
        const rawOutput = this.outputBuffers.get(processId);
        if (rawOutput) {
            const cleanOutput = stripAnsi(rawOutput);
            this.broadcast({
                action: 'server.process_output',
                processId,
                rawOutput,
                cleanOutput,
            });
            this.outputBuffers.set(processId, '');
        }
    }
    flushAllOutputBuffers() {
        this.outputBuffers.forEach((_, processId) => {
            this.flushOutputBuffer(processId);
        });
    }
    broadcast(message) {
        const serializedMessage = JSON.stringify(message);
        this.wss.clients.forEach((client) => {
            if (client.readyState === 1 /* WebSocket.OPEN */) {
                client.send(serializedMessage);
            }
        });
    }
}
export default WebSocketServer;
