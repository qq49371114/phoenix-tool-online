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

    // 【凤凰系统】的加解密核心 (我们之前已经修复好的，保持不变)
    function processKeyToWords(keyString) { return CryptoJS.enc.Utf8.parse(keyString.toString().padEnd(16, '0')); }
    function encryptAes(data, keyString, ivString) { const key = processKeyToWords(keyString); const iv = processKeyToWords(ivString); const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv }); return encrypted.ciphertext.toString(CryptoJS.enc.Hex); }
    function decryptAes(ciphertext, keyString, ivString) { try { const key = processKeyToWords(keyString); const iv = processKeyToWords(ivString); const ciphertextWords = CryptoJS.enc.Hex.parse(ciphertext); const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertextWords }, key, { iv: iv }); const decryptedText = decrypted.toString(CryptoJS.enc.Utf8); if (!decryptedText) return null; return decryptedText; } catch (e) { return null; } }

    // ====================  ↓↓↓ 【黎明计划】重铸VOD加密核心 ↓↓↓ ====================
    /**
     * 【已重铸】线路仓(VOD)加密函数
     * 完全模仿“大聪明”的简单拼接格式
     */
    function encryptVod(plaintext, keyString, ivString) {
        try {
            // 1. 【Key/IV处理】使用我们之前确定的、正确的“补0”规则
            const key = processKeyToWords(keyString);
            const iv = processKeyToWords(ivString);

            // 2. 【执行加密】
            const encrypted = CryptoJS.AES.encrypt(plaintext, key, { iv: iv });
            const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);

            // 3. 【拼接】按照“大聪明”的格式进行拼接
            //    注意：它的头部放的是原始明文的Hex，而不是Key！
            const plaintextHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(plaintext));
            const ivHex = CryptoJS.enc.Hex.stringify(iv); // IV的二进制内容的Hex

            return "2423" + plaintextHex + "2324" + encryptedHex + ivHex;

        } catch (e) {
            console.error("Encrypt VOD Error:", e);
            return null;
        }
    }
    
    /**
     * 【保持不变】线路仓(VOD)解密函数
     * 这个函数，就是用来解密“大聪明”那种格式的，所以它不需要修改
     */
    function decryptVod(ciphertext) {
        try {
            // 这个函数，就是我们从Java代码里翻译过来的，专门解那种简单格式的
            if (!ciphertext.startsWith("2423")) return null;
            const headerEndIndex = ciphertext.indexOf("2324");
            if (headerEndIndex === -1) return null;
            
            // 从密文中提取出IV
            const ivHex = ciphertext.substring(ciphertext.length - 32); // IV是最后16字节，即32个Hex字符
            const iv = CryptoJS.enc.Hex.parse(ivHex);

            // 【关键】从密文中提取出原始明文，并用它来生成Key
            const plaintextHex = ciphertext.substring(4, headerEndIndex);
            const plaintext = CryptoJS.enc.Hex.parse(plaintextHex).toString(CryptoJS.enc.Utf8);
            const key = processKeyToWords(plaintext); // 用明文作为Key的原始字符串

            // 提取加密主体并解密
            const encryptedDataHex = ciphertext.substring(headerEndIndex + 4, ciphertext.length - 32);
            const encryptedWords = CryptoJS.enc.Hex.parse(encryptedDataHex);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedWords }, key, { iv: iv });
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            if (!decryptedText) return null;
            return decryptedText;
        } catch (e) { 
            console.error("Decrypt VOD Error:", e);
            return null; 
        }
    }
    // ====================  ↑↑↑ 【黎明计划】重铸VOD加密核心 ↑↑↑ ====================

    function createSteganographyImage(configText) { showToast("生成图片功能待实现..."); }

    // --- 事件监听绑定 ---
    btnPaste.addEventListener('click', () => navigator.clipboard.readText().then(text => { mainInput.value = text; showToast('已粘贴'); }));
    btnCopy.addEventListener('click', () => { if(mainInput.value) navigator.clipboard.writeText(mainInput.value).then(() => showToast('已复制')); });
    btnClear.addEventListener('click', () => mainInput.value = "");

    // 修改VOD加密按钮，让它能接收Key和IV
    // 注意：我们需要在界面上增加输入Key和IV的地方，这里暂时用凤凰系统的Key/IV代替
    btnEncryptVod.addEventListener('click', () => { 
        const result = encryptVod(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); 
        if (result) mainInput.value = result; else showToast('加密失败！'); 
    });

    btnDecryptVod.addEventListener('click', () => { const r = decryptVod(mainInput.value); if (r) mainInput.value = r; else showToast('解密失败！'); });
    
    btnCreateImage.addEventListener('click', () => createSteganographyImage(mainInput.value));
    btnEncryptAct.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); });
    btnDecryptAct.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnEncryptRule.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); });
    btnDecryptRule.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnMd5.addEventListener('click', () => { mainInput.value = CryptoJS.MD5(mainInput.value).toString(); });
});
