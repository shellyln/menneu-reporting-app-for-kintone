// Copyright (c) 2019 Shellyl_N
// license: MIT
// https://github.com/shellyln

(() => {
    const REPORT_APP_ELEMENT_ID_PREFIX = 'ynNHW97QWJfO1WSR_';

    const start = async (source, data, options) => {
        const opts = Object.assign({}, options, {
            replacementMacros: [{
                re: /!!!lsx\s([\s\S]+?)!!!/g,
                fn: 'lsx', // evaluate input as LSX script
            }],
        });

        if (!opts.outputFormat || opts.outputFormat.toLowerCase() !== 'html') {
            const errText = `output format ${opts.outputFormat} is not available.`;
            throw new Error(errText);
        }

        const buf = await menneu.render(source, data || {}, opts);
        const resultUrl = URL.createObjectURL(new Blob([buf.toString()], { type: 'text/html' }));

        // schedule revoking the Blob URL.
        setTimeout(() => URL.revokeObjectURL(resultUrl), 5000);
        return resultUrl;
    };

    const getReportDef = async (reportRecord) => {
        let cf = Object.assign({
                inputFormat: reportRecord.record.switches.value.includes('LSX') ? 'lsx' : 'md',
                dataFormat: reportRecord.record.switches.value.includes('LispData') ? 'lisp' : 'json',
                outputFormat: 'html',
            },
            JSON.parse(window.ace_editor_instance_configs.getValue() || '{}'),
            (reportRecord.record.switches.value.includes('Scripting') ||
                reportRecord.record.switches.value.includes('LSX')) ? {} : {rawInput: true},
        );
        const cfGlobals = {
            "$to-locale-string": (...args) => args.slice(-1)[0].toLocaleString(...(args.slice(0, -1))),
        };
        cf.globals = Object.assign(cfGlobals, cf.globals || {});

        return { reportRecord, cf };
    };

    kintone.events.on(['app.record.detail.show', 'app.record.edit.show'], (event) => {
        const runReport = async () => {
            try {
                const recordId = kintone.app.record.getId();
                const resp = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
                    app: kintone.app.getId(),
                    id: recordId,
                });
                const { reportRecord, cf } = await getReportDef(resp);

                const resultUrl = await start(
                    window.ace_editor_instance_report_template.getValue(),
                    window.ace_editor_instance_preview_data.getValue(),
                    cf,
                );
                window.open(resultUrl, '_blank');
            } catch (err) {
                console.log(err);
                window.alert(err);
            }
        };

        const buttonId = REPORT_APP_ELEMENT_ID_PREFIX + 'detail_button_preview';
        if (document.getElementById(buttonId) !== null) {
            return;
        }

        const buttonEl = document.createElement('button');
        buttonEl.id = buttonId;
        buttonEl.className = 'kintoneplugin-button-dialog-ok';
        buttonEl.innerText = 'Preview';
        buttonEl.onclick = runReport;
        kintone.app.record.getHeaderMenuSpaceElement().appendChild(buttonEl);
    });

    let currentPreviewAppId = '';
    let currentPreviewQuery = '';

    kintone.events.on('app.record.edit.show', (event) => {
        const fetchData = async () => {
            try {
                const resp = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
                    app: Number(currentPreviewAppId),
                    query: currentPreviewQuery
                });
                window.ace_editor_instance_preview_data.setValue(JSON.stringify(resp.records), -1);
            } catch (err) {
                console.log(err);
                window.alert(err.message || err);
            }
        };

        currentPreviewAppId = event.record.preview_data_appid.value;
        currentPreviewQuery = event.record.preview_data_query.value;

        const buttonId = REPORT_APP_ELEMENT_ID_PREFIX + 'detail_edit_button_fetch_preview_data';
        if (document.getElementById(buttonId) !== null) {
            return;
        }

        var buttonEl = document.createElement('button');
        buttonEl.id = buttonId;
        buttonEl.className = 'kintoneplugin-button-dialog-ok';
        buttonEl.innerText = 'Fetch preview data';
        buttonEl.onclick = fetchData;
        kintone.app.record.getSpaceElement('preview_data_btns').appendChild(buttonEl);
    });

    kintone.events.on([
        'app.record.edit.change.preview_data_appid',
        'app.record.edit.change.preview_data_query'], (event) => {

        currentPreviewAppId = event.record.preview_data_appid.value;
        currentPreviewQuery = event.record.preview_data_query.value;
    });
})();
