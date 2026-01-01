import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, measureElement, Text, useStdout, } from 'ink';
import stringWidth from 'string-width';
const ProcessOutput = ({ process }) => {
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
    const containerRef = React.useRef(null);
    const { stdout } = useStdout();
    React.useEffect(() => {
        const measure = () => {
            if (containerRef.current) {
                const { width, height } = measureElement(containerRef.current);
                setDimensions({ width, height });
            }
        };
        // A short timeout helps ensure the layout has settled before measuring.
        const timeoutId = setTimeout(measure, 50);
        stdout.on('resize', measure);
        return () => {
            clearTimeout(timeoutId);
            stdout.off('resize', measure);
        };
    }, [stdout, process?.output]); // Re-measure when output changes to catch layout shifts
    const renderContent = () => {
        if (!process) {
            return _jsx(Text, { color: "gray", children: "No process selected." });
        }
        if (process.output === undefined) {
            return _jsx(Text, { color: "gray", children: "Loading history..." });
        }
        if (process.output) {
            const { width, height } = dimensions;
            if (width <= 0 || height <= 0)
                return _jsx(_Fragment, {});
            const allLines = process.output.split('\n');
            const visibleLines = [];
            let currentHeight = 0;
            // Fill the container from the bottom up with the most recent lines.
            for (let i = allLines.length - 1; i >= 0; i -= 1) {
                const line = allLines[i];
                const visualHeight = line.length === 0 ? 1 : Math.ceil(stringWidth(line) / width);
                if (currentHeight + visualHeight <= height) {
                    visibleLines.unshift(line);
                    currentHeight += visualHeight;
                }
                else {
                    break;
                }
            }
            // If truncation is needed, make space for the truncation message.
            const truncatedCount = allLines.length - visibleLines.length;
            if (truncatedCount > 0) {
                const truncationMessage = `... (truncated ${truncatedCount} lines) ...`;
                const messageHeight = Math.ceil(stringWidth(truncationMessage) / width);
                // Remove lines from the top until the message fits.
                while (currentHeight + messageHeight > height
                    && visibleLines.length > 0) {
                    const removedLine = visibleLines.shift();
                    if (removedLine) {
                        const removedHeight = removedLine.length === 0
                            ? 1
                            : Math.ceil(stringWidth(removedLine) / width);
                        currentHeight -= removedHeight;
                    }
                }
                // Only add the message if there's enough space.
                if (currentHeight + messageHeight <= height) {
                    visibleLines.unshift(truncationMessage);
                }
            }
            return _jsx(Text, { children: visibleLines.join('\n') });
        }
        return _jsx(Text, { color: "gray", children: "No output for this process." });
    };
    return (_jsxs(Box, { borderStyle: "round", paddingX: 1, flexDirection: "column", flexGrow: 1, children: [_jsx(Text, { color: "cyan", children: "Output" }), _jsx(Box, { ref: containerRef, marginTop: 1, flexGrow: 1, overflow: "hidden", minHeight: 0, children: dimensions.height > 0 && renderContent() })] }));
};
export default ProcessOutput;
