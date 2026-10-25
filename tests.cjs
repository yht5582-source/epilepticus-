// 執行：node tests.cjs（測試 index.html 內 /*ENGINE-START*/…/*ENGINE-END*/ 區塊）
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const src = html.split('/*ENGINE-START*/')[1].split('/*ENGINE-END*/')[0];
const ctx = { module: {} };
vm.runInNewContext(src, ctx);
const SE = ctx.module.exports;

let pass = 0, fail = 0;
function ok(cond, name) { if (cond) pass++; else { fail++; console.log('FAIL', name); } }
function eq(a, b, name) { ok(a === b, name + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
const dose = (w, p, id, flags) => SE.doses(w, flags)[p].find(d => d.id === id);
const min = m => m * 60000;
const ev = (kind, m) => ({ kind, t: min(m) });
const stageAt = (events, m) => SE.stage(SE.summarize(events, min(m)));

// ---- 體重驗證 ----
ok(SE.checkWeight('').error, '空白體重報錯（不再預設 60）');
ok(SE.checkWeight('0').error, '0 kg 報錯');
ok(SE.checkWeight('300').error, '>250 kg 報錯');
ok(SE.checkWeight('abc').error, '非數字報錯');
eq(SE.checkWeight('70').w, 70, '70 kg 有效');
eq(SE.checkWeight('30').peds, true, '<40 kg 標記兒童');

// ---- 第一線 ----
eq(dose(60, 1, 'lora').dose, '4 mg', 'Lorazepam 60 kg 封頂 4 mg');
eq(dose(25, 1, 'lora').dose, '2.5 mg', 'Lorazepam 25 kg = 2.5 mg');
eq(dose(60, 1, 'midaim').dose, '10 mg', 'Midazolam IM >40 kg = 10 mg');
eq(dose(40, 1, 'midaim').dose, '5 mg', 'Midazolam IM 40 kg = 5 mg');
eq(dose(13, 1, 'midaim').dose, '5 mg', 'Midazolam IM 13 kg = 5 mg');
eq(dose(10, 1, 'midaim').dose, '--', 'Midazolam IM <13 kg 不給固定劑量');
eq(dose(10, 1, 'midaim').log, null, 'Midazolam IM <13 kg 不能記錄');
eq(dose(60, 1, 'diaz').dose, '9 ~ 10 mg', 'Diazepam 60 kg 0.15–0.2 mg/kg 封頂 10');
eq(dose(80, 1, 'diaz').dose, '10 mg', 'Diazepam 80 kg 封頂 10 mg');

// ---- 第二線 ----
eq(dose(60, 2, 'lev').dose, '3600 mg', 'LEV 60 kg = 3600');
eq(dose(90, 2, 'lev').dose, '4500 mg', 'LEV 封頂 4500');
eq(dose(90, 2, 'vpa').dose, '3000 mg', 'VPA 封頂 3000');
eq(dose(90, 2, 'fos').dose, '1500 mg PE', 'Fosphenytoin 封頂 1500 PE');
eq(dose(90, 2, 'fos').time, '輸注 ≥10 分鐘', 'Fosphenytoin 1500/150 = 10 分');
eq(dose(70, 2, 'pht').time, '輸注 ≥28 分鐘', 'Phenytoin 1400/50 = 28 分');
eq(dose(60, 2, 'pb').dose, '900 mg', 'Phenobarbital 15 mg/kg');
ok(/避免/.test(dose(60, 2, 'vpa', { preg: true }).flag), 'VPA 懷孕警示');
ok(/避免/.test(dose(60, 2, 'vpa', { liver: true }).flag), 'VPA 肝病警示');
eq(dose(60, 2, 'vpa', {}).flag, '', 'VPA 無旗標無警示');
ok(/低血壓/.test(dose(60, 2, 'fos', { cardiac: true }).flag), 'Fosphenytoin 心臟警示');

// ---- 第三線 ----
ok(/Load 12 mg/.test(dose(60, 3, 'midaiv').dose), 'Midazolam IV load 0.2 mg/kg');
ok(/3 ~ 120 mg\/h/.test(dose(60, 3, 'midaiv').dose), 'Midazolam 維持 0.05–2 mg/kg/h');
ok(/起始 72 mg\/h；維持 108 ~ 720 mg\/h/.test(dose(60, 3, 'prop').dose), 'Propofol 20 / 30–200 mcg/kg/min 換算');
ok(/288 mg\/h/.test(dose(60, 3, 'prop').time), 'Propofol PRIS 80 mcg/kg/min = 288 mg/h');

// ---- 階段判斷 ----
eq(stageAt([], 2).key, 'stab', '2 分未給藥 → 穩定期');
eq(stageAt([], 5).key, 'initial', '5 分未給藥 → 第一線');
eq(stageAt([], 25).key, 'initial', '25 分未給藥仍是第一線（不跳到 RSE）');
ok(stageAt([], 25).alerts.length >= 2, '25 分未給藥 → BZD 與 ASM 逾時警示');
eq(stageAt([ev('bzd', 6)], 8).key, 'bzd-wait', 'BZD 後 <5 分 → 觀察');
eq(stageAt([ev('bzd', 6)], 12).key, 'bzd2', 'BZD 後 ≥5 分仍發作 → 重複 BZD');
eq(stageAt([ev('bzd', 6), ev('bzd', 12)], 14).key, 'second', '兩劑 BZD → 第二線');
eq(stageAt([ev('bzdIM', 3)], 6).key, 'second', 'Midazolam IM 單次後 → 第二線');
eq(stageAt([ev('bzd', 6), ev('bzd', 12), ev('asm', 15)], 20).key, 'second-wait', 'ASM 後 <10 分 → 觀察');
eq(stageAt([ev('bzd', 6), ev('bzd', 12), ev('asm', 15)], 26).key, 'refractory', 'ASM 後 ≥10 分仍發作 → RSE');
eq(stageAt([ev('bzd', 6), ev('stop', 9)], 15).key, 'stopped', '發作停止');
ok(stageAt([ev('bzd', 6), ev('stop', 9)], 15).alerts.length === 1, '僅 BZD 停止 → 提醒負荷 ASM');
eq(stageAt([ev('bzd', 6), ev('stop', 9), ev('recur', 14)], 15).key, 'bzd2', '再發 → 依治療紀錄繼續');
eq(stageAt([ev('bzd', 6), ev('bzd', 12), ev('asm', 15), ev('anes', 30)], 60).key, 'refractory', '麻醉藥中 → RSE');
ok(/超難治/.test(stageAt([ev('anes', 30)], 30 + 1440).title), '麻醉藥 ≥24h → SRSE');
ok(stageAt([], 31).alarm, '≥30 分 ILAE t2 警報');
ok(!stageAt([], 12).alarm, '12 分不警報');

// ---- 時間格式 ----
eq(SE.mmss(min(5) + 7000), '05:07', 'mm:ss');
eq(SE.mmss(min(75)), '1:15:00', '超過 1 小時顯示 h:mm:ss');

console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
