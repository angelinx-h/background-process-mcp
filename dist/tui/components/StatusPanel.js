import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
const formatUptime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds < 0)
        return 'N/A';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
};
const StatusPanel = (props) => {
    const { isConnected, serverVersion, processCount, port, pid, uptime, processCounts, } = props;
    const statusText = isConnected ? (_jsx(Text, { color: "green", children: "\u25CF Connected" })) : (_jsx(Text, { color: "red", children: "\u25CB Disconnected" }));
    const statusItems = [
        { label: 'Port', value: port },
        { label: 'PID', value: pid },
        { label: 'Uptime', value: formatUptime(uptime) },
        { label: 'Version', value: serverVersion },
        {
            label: 'Processes',
            value: processCounts && (_jsxs(Text, { children: [processCount, " (", _jsxs(Text, { color: "green", children: [processCounts.running, " running"] }), ", ", _jsxs(Text, { color: "yellow", children: [processCounts.stopped, " stopped"] }), ",", ' ', _jsxs(Text, { color: "red", children: [processCounts.errored, " errored"] }), ")"] })),
        },
    ].filter((item) => item.value !== null && item.value !== undefined);
    return (_jsxs(Box, { borderStyle: "round", paddingX: 1, flexDirection: "column", children: [_jsx(Text, { color: "cyan", children: "Server Status" }), _jsxs(Box, { marginTop: 1, flexWrap: "wrap", children: [_jsx(Box, { paddingRight: 1, children: _jsx(Text, { children: statusText }) }), statusItems.map((item) => (_jsx(Box, { paddingRight: 1, children: _jsxs(Text, { children: [_jsx(Text, { color: "gray", children: "| " }), item.label, ": ", item.value] }) }, item.label)))] })] }));
};
export default StatusPanel;
