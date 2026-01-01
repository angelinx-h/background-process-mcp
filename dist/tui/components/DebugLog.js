import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
const DebugLog = ({ log }) => (_jsxs(Box, { borderStyle: "round", paddingX: 1, flexDirection: "column", flexGrow: 1, children: [_jsx(Text, { color: "red", children: "Debug Log (Last 50 Messages)" }), _jsx(Box, { marginTop: 1, flexGrow: 1, flexDirection: "column", overflow: "hidden", children: log.map((line) => (_jsx(Text, { wrap: "wrap", children: line }, line))) })] }));
export default DebugLog;
