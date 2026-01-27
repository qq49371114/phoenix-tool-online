document.addEventListener('DOMContentLoaded', () => {
    // --- 元素获取、常量定义、辅助函数 (无变化) ---
    const mainInput = document.getElementById('main-input');
    const btnPaste = document.getElementById('btn-paste');
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');
    const btnEncryptVod = document.getElementById('btn-encrypt-vod');
    const btnDecryptVod = document.getElementById('btn-decrypt-vod');
    const btnCreateImage = document.getElementById('btn-create-image');
    const btnEncryptAct = document.getElementById('btn-encrypt-act');
    const btnDecryptAct = document.getElementById('btn-decrypt-act');
    const btnEncryptRule = document.getElementById('btn-encrypt-rule');
    const btnDecryptRule = document.getElementById('btn-decrypt-rule');
    const btnMd5 = document.getElementById('btn-md5');
    const PHOENIX_API_KEY = "PHOENIX-API-KEY!";
    const PHOENIX_API_IV = "PHOENIX-API-IV!!";
    const PHOENIX_RULE_KEY = "PHOENIX-RULE-KEY";
    const PHOENIX_RULE_IV = "PHOENIX-RULE-IV!";
    function randomString(length) { let result = ''; const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; for (let i = 0; i < length; i++) { result += characters.charAt(Math.floor(Math.random() * characters.length)); } return result; }
    function showToast(message) { const toast = document.createElement('div'); toast.textContent = message; toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:10px 20px; border-radius:5px; z-index:1000;'; document.body.appendChild(toast); setTimeout(() => { document.body.removeChild(toast); }, 2000); }

    // --- 核心加解密函数 ---
    function encryptAes(data, key, iv) { const keyHex = CryptoJS.enc.Utf8.parse(key); const ivHex = CryptoJS.enc.Utf8.parse(iv); const encrypted = CryptoJS.AES.encrypt(data, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }); return encrypted.toString(); }
    function decryptAes(ciphertext, key, iv) { try { const keyHex = CryptoJS.enc.Utf8.parse(key); const ivHex = CryptoJS.enc.Utf8.parse(iv); const decrypted = CryptoJS.AES.decrypt(ciphertext, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }); return decrypted.toString(CryptoJS.enc.Utf8); } catch (e) { return null; } }

    // 加密函数保持不变，它的输出格式是正确的
    function encryptVod(plaintext) {
        try {
            const key = randomString(16);
            const realIv = randomString(13);
            const aesIv = realIv.padEnd(16, '0');
            const keyWords = CryptoJS.enc.Utf8.parse(key);
            const ivWords = CryptoJS.enc.Utf8.parse(aesIv);
            const plaintextWords = CryptoJS.enc.Utf8.parse(plaintext);
            const encrypted = CryptoJS.AES.encrypt(plaintextWords, keyWords, { iv: ivWords, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
            const prefix = randomString(10) + "$#" + key + "#$" + randomString(10);
            const headerWithIv = prefix + realIv;
            const headerHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(headerWithIv)).toUpperCase();
            const footerHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(randomString(13))).toUpperCase();
            return "2423" + headerHex + "2324" + encryptedHex + footerHex;
        } catch (e) { console.error("Encrypt VOD Error:", e); return null; }
    }
    
    // 我们不需要“套娃”了，因为壳子的两个if是独立的
    // btnEncryptVod 直接调用 encryptVod 即可
    
    // ====================  ↓↓↓ 【最终修正】解密函数100%复刻Java逻辑 ↓↓↓ ====================
    function decryptVod(ciphertext) {
        try {
            if (!ciphertext.startsWith("2423")) return null;

            // 1. 【100%复刻】将完整Hex字符串，强制用Latin1转成一个（可能损坏的）字符串
            const decodedStr = CryptoJS.enc.Hex.parse(ciphertext).toString(CryptoJS.enc.Latin1).toLowerCase();

            // 2. 【100%复刻】从这个（可能损坏的）字符串中提取Key和IV
            const key = decodedStr.substring(decodedStr.indexOf('$#') + 2, decodedStr.indexOf('#$')).padEnd(16, '0');
            const iv = decodedStr.substring(decodedStr.length - 13).padEnd(16, '0');

            // 3. 【100%复刻】从原始Hex字符串中，截取加密主体部分
            const encryptedDataHex = ciphertext.substring(ciphertext.indexOf("2324") + 4, ciphertext.length - 26);
            
            // 4. 【100%复刻】执行解密
            const keyWords = CryptoJS.enc.Utf8.parse(key);
            const ivWords = CryptoJS.enc.Utf8.parse(iv);
            const encryptedWords = CryptoJS.enc.Hex.parse(encryptedDataHex);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedWords }, keyWords, { iv: ivWords, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

            if (!decryptedText) return null;
            return decryptedText;
        } catch (e) {
            console.error("Decrypt VOD Error:", e);
            return null;
        }
    }
    // ====================  ↑↑↑ 【最终修正】解密函数100%复刻Java逻辑 ↑↑↑ ====================

    function createSteganographyImage(configText) { showToast("生成图片功能待实现..."); }

    // --- 事件监听绑定 ---
    btnPaste.addEventListener('click', () => navigator.clipboard.readText().then(text => { mainInput.value = text; showToast('已粘贴'); }));
    btnCopy.addEventListener('click', () => { if(mainInput.value) navigator.clipboard.writeText(mainInput.value).then(() => showToast('已复制')); });
    btnClear.addEventListener('click', () => mainInput.value = "");

    // 加密按钮直接调用encryptVod，不再需要套娃
    btnEncryptVod.addEventListener('click', () => { 
        const result = encryptVod(mainInput.value);
        if (result) mainInput.value = result; else showToast('加密失败！');
    });

    // 解密按钮直接调用新的、100%复刻的解密函数
    btnDecryptVod.addEventListener('click', () => {
        const r = decryptVod(mainInput.value);
        if (r) mainInput.value = r; else showToast('解密失败！');
    });

    // --- 其他按钮的事件监听保持不变 ---
    btnCreateImage.addEventListener('click', () => createSteganographyImage(mainInput.value));
    btnEncryptAct.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); });
    btnDecryptAct.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnEncryptRule.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); });
    btnDecryptRule.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnMd5.addEventListener('click', () => { mainInput.value = CryptoJS.MD5(mainInput.value).toString(); });
});
