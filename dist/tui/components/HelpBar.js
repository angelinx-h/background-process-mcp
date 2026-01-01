import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
const helpItems = [
    { key: '▲▼', description: 'Navigate' },
    { key: '⏎', description: 'View Output' },
    { key: 'n', description: 'New' },
    { key: 's', description: 'Stop' },
    { key: 'c', description: 'Clear' },
    { key: 'q', description: 'Quit' },
];
const HelpBar = () => (_jsx(Box, { marginTop: 1, borderStyle: "round", children: _jsx(Box, { flexDirection: "row", flexWrap: "wrap", paddingX: 1, children: helpItems.map((item, index) => (_jsx(Box, { paddingRight: 1, children: _jsxs(Text, { children: [index > 0 && _jsx(Text, { color: "gray", children: "| " }), _jsx(Text, { bold: true, children: item.key }), " ", item.description] }) }, item.key))) }) }));
export default HelpBar;
