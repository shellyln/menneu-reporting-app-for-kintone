// Original source:
// https://developer.kintone.io/hc/en-us/articles/360008175233-Embed-Code-Editors

// Copyright (c) 2019 Original source authors, Shellyl_N
// https://github.com/shellyln

(() => {
    const TARGET_FIELDS = [{
        textAreaFieldCode: 'report_template',
        blankSpaceFieldCode: 'report_template_ace',
        theme: 'ace/theme/monokai',
        mode: 'ace/mode/lisp',
        maxLines: 30,
        minLines: 30,
        wrap: true,
    }, {
        textAreaFieldCode: 'configs',
        blankSpaceFieldCode: 'configs_ace',
        theme: 'ace/theme/monokai',
        mode: 'ace/mode/json',
        maxLines: 30,
        minLines: 30,
        wrap: true,
    }, {
        textAreaFieldCode: 'preview_data',
        blankSpaceFieldCode: 'preview_data_ace',
        theme: 'ace/theme/monokai',
        mode: 'ace/mode/json',
        maxLines: 30,
        minLines: 30,
        wrap: true,
    }];

    const acefy = ({textAreaFieldCode, blankSpaceFieldCode, theme, mode, maxLines, minLines, wrap}, globalNSName) => {
        let editor;

        // define a function that will display the ace editor on any page:
        function showEditor() {
            kintone.app.record.setFieldShown(textAreaFieldCode, false);
            const editor_id = kintone.app.record.getSpaceElement(blankSpaceFieldCode).id;
            editor = ace.edit(editor_id);
            editor.$blockScrolling = Infinity;
            editor.setOptions({
                theme,
                mode,
                maxLines,
                minLines,
                wrap,
            });

            return editor;
        }

        // On the details page, display the editor with [uneditable] code and remove the cursor shown in the editor
        const recordDisplayEvents = 'app.record.detail.show';

        kintone.events.on(recordDisplayEvents, function(event) {
            editor = showEditor();
            editor.setValue(event.record[textAreaFieldCode].value, -1);
            //Set the editor to "read only" mode
            editor.setReadOnly(true);

            if (globalNSName) {
                window[globalNSName] = editor;
            }

            // Remove the cursor
            const cursor = document.getElementsByClassName('ace_cursor')[0];
            cursor.parentNode.removeChild(cursor);
            return event;
        });

        // When creating/editing the record, display the editor with code:
        const recordEditEvents = ['app.record.create.show', 'app.record.edit.show'];

        kintone.events.on(recordEditEvents, function(event) {
            editor = showEditor();
            if (event.type === 'app.record.edit.show') {
                editor.setValue(event.record[textAreaFieldCode].value, -1);
                editor.setReadOnly(false);
            }

            if (globalNSName) {
                window[globalNSName] = editor;
            }

            return event;
        });

        // When saving the record, save the contents of the editor into the text area field
        const recordSaveEvents = ['app.record.create.submit', 'app.record.edit.submit'];

        kintone.events.on(recordSaveEvents, function(event) {
            event.record[textAreaFieldCode].value = editor.getValue();
            return event;
        });
    };

    for (const f of TARGET_FIELDS) {
        acefy(f, 'ace_editor_instance_' + f.textAreaFieldCode);
    }
})();
