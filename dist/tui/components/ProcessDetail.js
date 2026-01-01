import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
const formatUptime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) {
        return 'N/A';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (hours > 0)
        return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0)
        return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
};
const ProcessDetail = ({ process }) => {
    if (!process) {
        return (_jsxs(Box, { borderStyle: "round", paddingX: 1, flexDirection: "column", width: "100%", children: [_jsx(Text, { color: "cyan", children: "Process Details" }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "No process selected." }) })] }));
    }
    return (_jsxs(Box, { borderStyle: "round", paddingX: 1, flexDirection: "column", children: [_jsx(Text, { color: "cyan", children: "Process Details" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", width: "100%", children: [_jsx(Box, { flexShrink: 0, children: _jsx(Text, { children: "ID: " }) }), _jsx(Box, { flexGrow: 1, overflow: "hidden", children: _jsx(Text, { wrap: "truncate-end", children: process.id }) })] }), _jsxs(Box, { flexDirection: "row", width: "100%", children: [_jsx(Box, { flexShrink: 0, children: _jsx(Text, { children: "Command: " }) }), _jsx(Box, { flexGrow: 1, marginLeft: 1, children: _jsx(Text, { wrap: "truncate-end", children: process.command }) })] }), _jsx(Box, { children: _jsxs(Text, { children: ["PID: ", process.pid ?? 'N/A'] }) }), _jsx(Box, { children: _jsxs(Text, { children: ["Status: ", process.status] }) }), _jsx(Box, { children: _jsxs(Text, { children: ["Uptime: ", formatUptime(process.uptime)] }) }), _jsx(Box, { children: _jsxs(Text, { children: ["Exit Code: ", process.exitCode ?? 'N/A'] }) })] })] }));
};
export default ProcessDetail;
