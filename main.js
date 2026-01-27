document.addEventListener('DOMContentLoaded', () => {
    // --- 元素获取、常量定义、辅助函数 (这部分无变化) ---
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
    
    // ====================  ↓↓↓ 加密“胶水”修正开始 ↓↓↓ ====================
    function encryptVodNested(plaintext) {
        const innerEncryptedHex = encryptVod(plaintext); // 得到的是十六进制字符串
        if (!innerEncryptedHex) return null;

        // 1. 先将十六进制字符串，解析成真正的二进制数据(WordArray)
        const innerEncryptedWords = CryptoJS.enc.Hex.parse(innerEncryptedHex);
        
        // 2. 再将这个二进制数据，编码成Base64字符串
        const base64Encoded = CryptoJS.enc.Base64.stringify(innerEncryptedWords);

        return randomString(8) + "**" + base64Encoded;
    }
    // ====================  ↑↑↑ 加密“胶水”修正结束 ↑↑↑ ====================

    function decryptVod(ciphertext) {
        try {
            if (!ciphertext.startsWith("2423")) return null;
            const headerEndIndex = ciphertext.indexOf("2324");
            if (headerEndIndex === -1) return null;
            const headerHex = ciphertext.substring(4, headerEndIndex);
            const headerStr = CryptoJS.enc.Hex.parse(headerHex).toString(CryptoJS.enc.Utf8);
            const key = headerStr.substring(headerStr.indexOf("$#") + 2, headerStr.indexOf("#$"));
            const realIv = headerStr.substring(headerStr.length - 13);
            if (!key || realIv.length !== 13) return null;
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

    // --- 事件监听绑定 ---
    btnPaste.addEventListener('click', () => navigator.clipboard.readText().then(text => { mainInput.value = text; showToast('已粘贴'); }));
    btnCopy.addEventListener('click', () => { if(mainInput.value) navigator.clipboard.writeText(mainInput.value).then(() => showToast('已复制')); });
    btnClear.addEventListener('click', () => mainInput.value = "");

    btnEncryptVod.addEventListener('click', () => { const result = encryptVodNested(mainInput.value); if (result) mainInput.value = result; else showToast('加密失败！'); });

    // ====================  ↓↓↓ 解密“胶水”修正开始 ↓↓↓ ====================
    btnDecryptVod.addEventListener('click', () => {
        let content = mainInput.value;
        if (content.includes('**')) {
            try { 
                const base64Part = content.split('**')[1];
                // 1. 先将Base64字符串，解码成真正的二进制数据(WordArray)
                const decodedWords = CryptoJS.enc.Base64.parse(base64Part);
                // 2. 再将这个二进制数据，转换成十六进制字符串，交给解密函数处理
                content = CryptoJS.enc.Hex.stringify(decodedWords);
            } catch (e) {
                showToast('Base64解码失败！');
                return;
            }
        }
        const r = decryptVod(content);
        if (r) mainInput.value = r; else showToast('解密失败！');
    });
    // ====================  ↑↑↑ 解密“胶水”修正结束 ↑↑↑ ====================

    btnCreateImage.addEventListener('click', () => createSteganographyImage(mainInput.value));
    btnEncryptAct.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); });
    btnDecryptAct.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnEncryptRule.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); });
    btnDecryptRule.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnMd5.addEventListener('click', () => { mainInput.value = CryptoJS.MD5(mainInput.value).toString(); });
});
