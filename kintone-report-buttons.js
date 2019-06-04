// Copyright (c) 2019 Shellyl_N
// license: MIT
// https://github.com/shellyln

(() => {
    const REPORT_APP_ELEMENT_ID_PREFIX = 'eXnhAMYWrBVFMczJ_';

    // NOTE: following global variables should be defined before loading this script.
    //   window.eXnhAMYWrBVFMczJ__REPORT_APP_ID: number
    //   window.eXnhAMYWrBVFMczJ__REPORT_BUTTONS: Array<{id: number}>

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

    const getReportDef = async (reportId) => {
        const reportRecord = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
            app: window.eXnhAMYWrBVFMczJ__REPORT_APP_ID,
            id: reportId,
        });
        let cf = Object.assign({
                inputFormat: reportRecord.record.switches.value.includes('LSX') ? 'lsx' : 'md',
                dataFormat: 'object',
                outputFormat: 'html',
            },
            JSON.parse(reportRecord.record.configs.value || '{}'),
            (reportRecord.record.switches.value.includes('Scripting') ||
                reportRecord.record.switches.value.includes('LSX')) ? {} : {rawInput: true},
        );
        const cfGlobals = {
            "$to-locale-string": (...args) => args.slice(-1)[0].toLocaleString(...(args.slice(0, -1))),
        };
        cf.globals = Object.assign(cfGlobals, cf.globals || {});

        return { reportRecord, cf };
    };

    kintone.events.on('app.record.detail.show', (event) => {
        const runReport = reportId => async () => {
            try {
                const { reportRecord, cf } = await getReportDef(reportId);
    
                const recordId = kintone.app.record.getId();
                const resp = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
                    app: kintone.app.getId(),
                    id: recordId,
                });
                const resultUrl = await start(
                    reportRecord.record.report_template.value,
                    resp.record,
                    cf,
                );
                window.open(resultUrl, '_blank');
            } catch (err) {
                console.log(err);
                window.alert(err);
            }
        };

        (async () => {
            for (const report of window.eXnhAMYWrBVFMczJ__REPORT_BUTTONS) {
                const buttonId = REPORT_APP_ELEMENT_ID_PREFIX + 'detail_button_' + report.id;
                if (document.getElementById(buttonId) !== null) {
                    continue;
                }

                const reportRecord = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
                    app: window.eXnhAMYWrBVFMczJ__REPORT_APP_ID,
                    id: report.id,
                });
                if (! reportRecord.record.switches.value.includes('Detail')) {
                    continue;
                }

                const buttonEl = document.createElement('button');
                buttonEl.id = buttonId;
                buttonEl.className = 'kintoneplugin-button-dialog-ok';
                buttonEl.innerText = reportRecord.record.report_name.value;
                buttonEl.onclick = runReport(report.id);
                kintone.app.record.getHeaderMenuSpaceElement().appendChild(buttonEl);
            }
        })();
    });

    kintone.events.on('app.record.index.show', (event) => {
        const runReport = reportId => async () => {
            try {
                const { reportRecord, cf } = await getReportDef(reportId);
    
                const condition = kintone.app.getQueryCondition();
                const resp =  await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
                    app: kintone.app.getId(),
                    query: condition,
                });
                const resultUrl = await start(
                    reportRecord.record.report_template.value,
                    resp.records,
                    cf,
                );
                window.open(resultUrl, '_blank');
            } catch (err) {
                console.log(err);
                window.alert(err);
            }
        };

        (async () => {
            for (const report of window.eXnhAMYWrBVFMczJ__REPORT_BUTTONS) {
                const buttonId = REPORT_APP_ELEMENT_ID_PREFIX + 'index_button_' + report.id;
                if (document.getElementById(buttonId) !== null) {
                    continue;
                }

                const reportRecord = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
                    app: window.eXnhAMYWrBVFMczJ__REPORT_APP_ID,
                    id: report.id,
                });
                if (! reportRecord.record.switches.value.includes('List')) {
                    continue;
                }

                const buttonEl = document.createElement('button');
                buttonEl.id = buttonId;
                buttonEl.className = 'kintoneplugin-button-dialog-ok';
                buttonEl.innerText = reportRecord.record.report_name.value;
                buttonEl.onclick = runReport(report.id);
                kintone.app.getHeaderMenuSpaceElement().appendChild(buttonEl);
            }
        })();
    });
})();
