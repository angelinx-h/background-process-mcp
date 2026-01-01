import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { TextInput } from '@inkjs/ui';
import { Box, Text, useInput } from 'ink';
const InputBar = ({ onSubmit, onCancel }) => {
    // We use a key to force a re-mount of the uncontrolled component, which is the
    // idiomatic way to clear its internal state from a parent.
    const [clearKey, setClearKey] = useState(0);
    useInput((input, key) => {
        if (key.escape) {
            onCancel();
        }
        // Add a shortcut to clear the input (Ctrl+U is a common terminal shortcut)
        if (key.ctrl && input === 'u') {
            setClearKey((prev) => prev + 1);
        }
    });
    // Wrap the onSubmit handler to prevent empty submissions.
    const handleSubmit = (command) => {
        if (command.trim().length > 0) {
            onSubmit(command);
        }
        else {
            // If the input is empty, just clear it for a better UX.
            setClearKey((prev) => prev + 1);
        }
    };
    return (_jsxs(Box, { marginTop: 1, paddingX: 1, borderStyle: "round", children: [_jsx(Box, { marginRight: 1, children: _jsx(Text, { children: "Command:" }) }), _jsx(TextInput, { placeholder: "Enter command (Esc to cancel, Ctrl+U to clear)", onSubmit: handleSubmit }, clearKey)] }));
};
export default InputBar;
