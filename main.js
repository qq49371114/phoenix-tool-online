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

    // ====================  ↓↓↓ 【最终测试基准】移植自 mao.js 的正确代码 ↓↓↓ ====================
    /**
     * 预处理Key和IV的函数
     * 遵循“不够补0，并转为WordArray”的原则
     */
    function processKeyToWords(keyString) {
        return CryptoJS.enc.Utf8.parse(keyString.toString().padEnd(16, '0'));
    }

    /**
     * 标准AES加密 (移植自 mao.js)
     */
    function encryptAes(data, keyString, ivString) {
        const key = processKeyToWords(keyString);
        const iv = processKeyToWords(ivString);
        const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv });
        return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
    }

    /**
     * 标准AES解密 (移植自 mao.js)
     */
    function decryptAes(ciphertext, keyString, ivString) {
        try {
            const key = processKeyToWords(keyString);
            const iv = processKeyToWords(ivString);
            const ciphertextWords = CryptoJS.enc.Hex.parse(ciphertext);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertextWords }, key, { iv: iv });
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            if (!decryptedText) return null;
            return decryptedText;
        } catch (e) {
            return null;
        }
    }
    // ====================  ↑↑↑ 【最终测试基准】移植自 mao.js 的正确代码 ↑↑↑ ====================

    // VOD相关函数保持我们之前最稳健的版本
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
    
    function decryptVod(ciphertext) {
        try {
            if (!ciphertext.startsWith("2423")) return null;
            const headerEndIndex = ciphertext.indexOf("2324");
            if (headerEndIndex === -1) return null;
            const headerHex = ciphertext.substring(4, headerEndIndex);
            const headerStr = CryptoJS.enc.Hex.parse(headerHex).toString(CryptoJS.enc.Latin1);
            const key = headerStr.substring(headerStr.indexOf("$#") + 2, headerStr.indexOf("#$"));
            const realIv = headerStr.substring(headerStr.length - 13);
            if (!key || key.length === 0 || realIv.length !== 13) return null;
            const aesIv = realIv.padEnd(16, '0');
            const encryptedDataHex = ciphertext.substring(headerEndIndex + 4, ciphertext.length - 26);
            const keyWords = CryptoJS.enc.Utf8.parse(key);
            const ivWords = CryptoJS.enc.Utf8.parse(aesIv);
            const encryptedWords = CryptoJS.enc.Hex.parse(encryptedDataHex);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedWords }, keyWords, { iv: ivWords, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            if (!decryptedText) return null;
            return decryptedText;
        } catch (e) { console.error("Decrypt VOD Error:", e); return null; }
    }

    function createSteganographyImage(configText) { showToast("生成图片功能待实现..."); }

    // --- 事件监听绑定 (无变化) ---
    btnPaste.addEventListener('click', () => navigator.clipboard.readText().then(text => { mainInput.value = text; showToast('已粘贴'); }));
    btnCopy.addEventListener('click', () => { if(mainInput.value) navigator.clipboard.writeText(mainInput.value).then(() => showToast('已复制')); });
    btnClear.addEventListener('click', () => mainInput.value = "");
    btnEncryptVod.addEventListener('click', () => { const result = encryptVod(mainInput.value); if (result) mainInput.value = result; else showToast('加密失败！'); });
    btnDecryptVod.addEventListener('click', () => { const r = decryptVod(mainInput.value); if (r) mainInput.value = r; else showToast('解密失败！'); });
    btnCreateImage.addEventListener('click', () => createSteganographyImage(mainInput.value));
    btnEncryptAct.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); });
    btnDecryptAct.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnEncryptRule.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); });
    btnDecryptRule.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnMd5.addEventListener('click', () => { mainInput.value = CryptoJS.MD5(mainInput.value).toString(); });
});
