import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Box, measureElement, Text, useInput, useStdout, } from 'ink';
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
const LiveOutputView = ({ process, terminalHeight, maxLines = 2000, }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const [isLocked, setIsLocked] = useState(true);
    const [containerHeight, setContainerHeight] = useState(0);
    const containerRef = useRef(null);
    const { stdout } = useStdout();
    const lines = (process.output ?? '').split('\n').slice(-maxLines);
    const totalLines = lines.length;
    const maxScroll = Math.max(0, totalLines - containerHeight);
    useEffect(() => {
        const measure = () => {
            if (containerRef.current) {
                const { height } = measureElement(containerRef.current);
                setContainerHeight(height);
            }
        };
        const timeoutId = setTimeout(measure, 50);
        stdout.on('resize', measure);
        return () => {
            clearTimeout(timeoutId);
            stdout.off('resize', measure);
        };
    }, [stdout]);
    useEffect(() => {
        if (isLocked) {
            setScrollTop(maxScroll);
        }
    }, [totalLines, containerHeight, isLocked, maxScroll]);
    useInput((_, key) => {
        if (key.upArrow) {
            setIsLocked(false);
            setScrollTop((prev) => Math.max(0, prev - 1));
        }
        if (key.downArrow) {
            const newScrollTop = Math.min(scrollTop + 1, maxScroll);
            setScrollTop(newScrollTop);
            if (newScrollTop >= maxScroll)
                setIsLocked(true);
        }
        if (key.pageUp) {
            setIsLocked(false);
            setScrollTop((prev) => Math.max(0, prev - containerHeight));
        }
        if (key.pageDown) {
            const newScrollTop = Math.min(scrollTop + containerHeight, maxScroll);
            setScrollTop(newScrollTop);
            if (newScrollTop >= maxScroll)
                setIsLocked(true);
        }
    });
    const renderOutput = () => {
        if (totalLines === 0) {
            return _jsx(Text, { color: "gray", children: "No output yet..." });
        }
        const visibleLines = lines.slice(scrollTop, scrollTop + containerHeight);
        return _jsx(Text, { children: visibleLines.join('\n') });
    };
    const renderScrollbar = () => {
        if (totalLines <= containerHeight)
            return _jsx(_Fragment, {});
        const thumbSize = Math.max(1, Math.floor((containerHeight / totalLines) * containerHeight));
        const thumbPosition = Math.floor((scrollTop / maxScroll) * (containerHeight - thumbSize));
        const scrollbar = Array.from({ length: containerHeight }, (_, i) => {
            if (i >= thumbPosition && i < thumbPosition + thumbSize) {
                return '█';
            }
            return '░';
        });
        return (_jsx(Box, { flexDirection: "column", marginLeft: 1, children: _jsx(Text, { children: scrollbar.join('\n') }) }));
    };
    return (_jsxs(Box, { flexDirection: "column", width: "100%", height: terminalHeight, borderStyle: "round", padding: 1, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Live Output for: " }), _jsx(Text, { children: process.command }), _jsx(Text, { children: " (" }), _jsxs(Text, { color: getStatusColor(process.status), children: ["\u25CF ", process.status] }), _jsx(Text, { children: ")" })] }), _jsxs(Box, { marginTop: 1, flexGrow: 1, borderStyle: "round", paddingX: 1, flexDirection: "row", overflow: "hidden", children: [_jsx(Box, { ref: containerRef, flexGrow: 1, flexDirection: "column", overflow: "hidden", children: containerHeight > 0 && renderOutput() }), containerHeight > 0 && renderScrollbar()] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "Use \u2191\u2193/PgUp/PgDn to scroll. Press 'esc' to return." }) })] }));
};
export default LiveOutputView;
