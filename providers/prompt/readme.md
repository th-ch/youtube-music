# Prompt Documentation

<p align="center"><img width="482" alt="prompt-preview" src="https://user-images.githubusercontent.com/17620180/111753337-09c0c680-8897-11eb-8ce8-43de29c143bd.png"></p>

## Usage
```js
prompt([options, parentBrowserWindow]).then(...).catch(...)
```
Promise resolve returns input

If user presses cancel/exit window, input = null;

On error, Prompise reject returns custom error message
## Example

```js
const prompt = require('./providers/prompt');

prompt({
    title: 'Prompt example',
    label: 'URL:',
    value: 'http://example.org',
    inputAttrs: {
        type: 'url'
    },
    type: 'input'
})
.then((r) => {
    if(r === null) {
        console.log('user cancelled');
    } else {
        console.log('result', r);
    }
})
.catch(console.error);
```

### Options object (optional)

| Key                | Explanation                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| title              | (optional, string) The title of the prompt window. Defaults to 'Prompt'.                                                                                                                                                       |
| label              | (optional, string) The label which appears on the prompt for the input field. Defaults to 'Please input a value:'.                                                                                                             |
| buttonLabels       | (optional, object) The text for the OK/cancel buttons. Properties are 'ok' and 'cancel'. Defaults to null.                                                                                                                     |
| value              | (optional, string) The default value for the input field. Defaults to null.                                                                                                                                                    |
| type               | (optional, string) The type of input field, either 'input' for a standard text input field or 'select' for a dropdown type input or 'counter' for a number counter with buttons. Defaults to 'input'.                                                                         |
| inputAttrs         | (optional, object) The attributes of the input field, analagous to the HTML attributes: `{type: 'text', required: true}` -> `<input type="text" required>`. Used if the type is 'input'
| counterOptions     | (optional, object) minimum and maximum of counter in format: `{minimum: %int%, maximum: %int%} `                                     |
| selectOptions      | (optional, object) The items for the select dropdown if using the 'select' type in the format 'value': 'display text', where the value is what will be given to the then block and the display text is what the user will see. |
| useHtmlLabel       | (optional, boolean) Whether the label should be interpreted as HTML or not. Defaults to false.                                                                                                                                 |
| width              | (optional, integer) The width of the prompt window. Defaults to 370.                                                                                                                                                           |
| minWidth           | (optional, integer) The minimum allowed width for the prompt window. Same default value as width.                                                                                                                              |
| height             | (optional, integer) The height of the prompt window. Defaults to 130.                                                                                                                                                          |
| minHeight          | (optional, integer) The minimum allowed height for the prompt window. Same default value as height.                                                                                                                            |
| resizable          | (optional, boolean) Whether the prompt window can be resized or not (also sets useContentSize). Defaults to false.                                                                                                             |
| alwaysOnTop        | (optional, boolean) Whether the window should always stay on top of other windows. Defaults to false                                                                                                                           |
| icon               | (optional, string) The path to an icon image to use in the title bar. Defaults to null and uses electron's icon.                                                                                                               |
| customStylesheet   | (optional, string) The local path of a CSS file to stylize the prompt window. Defaults to null.                                                                                                                                |
| menuBarVisible     | (optional, boolean) Whether to show the menubar or not. Defaults to false.                                                                                                                                                     |
| skipTaskbar        | (optional, boolean) Whether to show the prompt window icon in taskbar. Defaults to true.                                                                                                                                       |
| frame              | (optional, boolean) Wether to create prompt with frame. Defaults to true.                                                                                                                                                      |
| customScript       | (optional, string) The local path of a JS file to run on preload. Defaults to null.                                                                                                                                            |
| enableRemoteModule | (optional, boolean) Wether the prompt window have remote modules activated, Defaults to false.                                                                                                                                 |

If not supplied, it uses the defaults listed in the table above.

### parentBrowserWindow (optional)

The window in which to display the prompt on. If not supplied, the parent window of the prompt will be null.

### customScript (optional)

Create the script with the following template:

```node
module.exports = () => {
    // This function will be called as a preload script
    // So you can use front features like `document.querySelector`
};
```
