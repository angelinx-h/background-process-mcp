import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
const getStatusColor = (status) => {
    switch (status) {
        case 'running':
            return 'green';
        case 'stopped':
            return 'yellow';
        case 'error':
            return 'red';
        default:
            return 'gray';
    }
};
const ProcessList = ({ processes, selectedProcessId, }) => (_jsxs(Box, { borderStyle: "round", paddingX: 1, flexDirection: "column", width: "100%", children: [_jsx(Text, { color: "cyan", children: "Processes" }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [processes.length === 0 && _jsx(Text, { color: "gray", children: "No processes running." }), processes.map((p) => (_jsxs(Box, { flexDirection: "row", width: "100%", backgroundColor: p.id === selectedProcessId ? 'blue' : undefined, children: [_jsx(Box, { flexShrink: 0, children: _jsx(Text, { color: p.id === selectedProcessId ? 'white' : getStatusColor(p.status), children: "\u25CF" }) }), _jsx(Box, { flexGrow: 1, marginLeft: 1, overflow: "hidden", children: _jsx(Text, { color: p.id === selectedProcessId ? 'white' : 'white', wrap: "truncate-end", children: p.command }) }), _jsx(Box, { flexShrink: 0, marginLeft: 1, children: _jsxs(Text, { color: p.id === selectedProcessId ? 'white' : 'gray', children: ["(", p.pid ?? 'N/A', ") - ", p.status] }) })] }, p.id)))] })] }));
export default ProcessList;
