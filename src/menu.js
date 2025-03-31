export const MenuTemplate = [
    {
        label: 'File',
        submenu: [
            { label: 'Open', click: () => console.log('Open clicked') },
            { label: 'Save', click: () => console.log('Save clicked') },
            { type: 'separator' },
            { label: 'Exit', role: 'quit' }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            { label: 'Undo', role: 'undo' },
            { label: 'Redo', role: 'redo' },
            { type: 'separator' },
            { label: 'Cut', role: 'cut' },
            { label: 'Copy', role: 'copy' },
            { label: 'Paste', role: 'paste' }
        ]
    }
];
