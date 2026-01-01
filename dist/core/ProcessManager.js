import { createRequire } from 'node:module';
import os from 'node:os';
import treeKill from 'tree-kill';
import { v4 as uuidv4 } from 'uuid';
import ensureNodePtyBinary from '../utils/ensureNodePtyBinary.js';
const require = createRequire(import.meta.url);
ensureNodePtyBinary();
const pty = require('node-pty');
const MAX_CONCURRENT_PROCESSES = 20;
const MAX_HISTORY_LINES_PER_PROCESS = 2000;
const SHELL = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
export class ProcessManager {
    static instances = new Set();
    processes = new Map();
    events;
    constructor(events) {
        this.events = events;
        ProcessManager.instances.add(this);
    }
    destroy() {
        ProcessManager.instances.delete(this);
    }
    static async globalCleanup() {
        const allInstances = Array.from(ProcessManager.instances);
        const killPromises = allInstances.flatMap((instance) => instance.getAllKillPromises());
        if (killPromises.length === 0) {
            return;
        }
        // A short timeout to allow all kill signals to be processed.
        const timeout = setTimeout(() => {
            // eslint-disable-next-line no-console
            console.warn('Global cleanup timed out. Some processes may not have been terminated.');
            throw new Error('Global cleanup timed out.');
        }, 3000);
        await Promise.all(killPromises);
        clearTimeout(timeout);
    }
    getAllKillPromises() {
        const runningProcesses = Array.from(this.processes.values()).filter((p) => p.state.status === 'running');
        return runningProcesses.map(async (p) => new Promise((resolve) => {
            if (p.state.pid) {
                treeKill(p.state.pid, 'SIGKILL', () => resolve());
            }
            else {
                resolve();
            }
        }));
    }
    startProcess(command) {
        if (this.processes.size >= MAX_CONCURRENT_PROCESSES) {
            throw new Error('Maximum number of concurrent processes reached.');
        }
        const id = uuidv4();
        const startTime = Date.now();
        const ptyProcess = pty.spawn(SHELL, ['-c', command], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env,
        });
        const initialState = {
            id,
            command,
            pid: ptyProcess.pid,
            status: 'running',
            uptime: 0,
        };
        this.processes.set(id, {
            state: initialState,
            ptyProcess,
            history: [],
            startTime,
        });
        this.events.onProcessStarted(initialState);
        ptyProcess.onData((data) => {
            const cleanedData = data
                .split('\n')
                .map((line) => line.trimEnd())
                .join('\n');
            const processInfo = this.processes.get(id);
            if (processInfo) {
                processInfo.history.push(cleanedData);
                if (processInfo.history.length > MAX_HISTORY_LINES_PER_PROCESS) {
                    processInfo.history.splice(0, processInfo.history.length - MAX_HISTORY_LINES_PER_PROCESS);
                }
            }
            this.events.onProcessOutput(id, cleanedData);
        });
        ptyProcess.onExit(({ exitCode, signal, }) => {
            const processInfo = this.processes.get(id);
            if (processInfo) {
                processInfo.state.status = exitCode === 0 ? 'stopped' : 'error';
                processInfo.state.exitCode = exitCode;
                processInfo.endTime = Date.now();
                this.events.onProcessStopped(id, exitCode, signal?.toString() ?? null);
            }
        });
        return initialState;
    }
    stopProcess(processId) {
        const processInfo = this.processes.get(processId);
        if (!processInfo || processInfo.state.status !== 'running') {
            throw new Error('Process not found or not running.');
        }
        if (processInfo.state.pid) {
            treeKill(processInfo.state.pid);
        }
    }
    clearProcess(processId) {
        const processInfo = this.processes.get(processId);
        if (!processInfo) {
            throw new Error('Process not found.');
        }
        if (processInfo.state.status === 'running') {
            throw new Error('Cannot clear a running process. Stop it first.');
        }
        this.processes.delete(processId);
    }
    getProcess(processId) {
        const processInfo = this.processes.get(processId);
        if (!processInfo)
            return undefined;
        return ProcessManager.calculateUptime(processInfo);
    }
    getProcessOutput(processId, options) {
        const processInfo = this.processes.get(processId);
        if (!processInfo)
            return undefined;
        const fullLog = processInfo.history.join('');
        // Normalize CRLF to LF before splitting to handle pty output correctly.
        const lines = fullLog.replace(/\r\n/g, '\n').split('\n');
        if (lines[lines.length - 1] === '') {
            lines.pop();
        }
        if (options?.head !== undefined) {
            return lines.slice(0, options.head);
        }
        if (options?.tail !== undefined) {
            return lines.slice(-options.tail);
        }
        return lines;
    }
    getAllProcesses() {
        return Array.from(this.processes.values()).map((p) => ProcessManager.calculateUptime(p));
    }
    static calculateUptime(processInfo) {
        const endTime = processInfo.endTime ?? Date.now();
        const uptime = (endTime - processInfo.startTime) / 1000; // in seconds
        return { ...processInfo.state, uptime };
    }
    getProcessCounts() {
        const counts = {
            total: this.processes.size,
            running: 0,
            stopped: 0,
            errored: 0,
        };
        this.processes.forEach(({ state }) => {
            if (state.status === 'running') {
                counts.running += 1;
            }
            else if (state.status === 'stopped') {
                counts.stopped += 1;
            }
            else if (state.status === 'error') {
                counts.errored += 1;
            }
        });
        return counts;
    }
}
