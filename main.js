// 等待整个网页都加载完毕后，再执行我们的代码
document.addEventListener('DOMContentLoaded', (event) => {

    // --- 1. 获取所有的“零件” (DOM元素) ---
    const mainInput = document.getElementById('main-input');
    
    // 剪贴板按钮
    const btnPaste = document.getElementById('btn-paste');
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');

    // 功能按钮
    const btnEncryptVod = document.getElementById('btn-encrypt-vod');
    const btnDecryptVod = document.getElementById('btn-decrypt-vod');
    const btnCreateImage = document.getElementById('btn-create-image');
    const btnParseImage = document.getElementById('btn-parse-image');
    const btnEncryptAct = document.getElementById('btn-encrypt-act');
    const btnDecryptAct = document.getElementById('btn-decrypt-act');
    const btnEncryptRule = document.getElementById('btn-encrypt-rule');
    const btnDecryptRule = document.getElementById('btn-decrypt-rule');
    const btnMd5 = document.getElementById('btn-md5');
    const btnAbout = document.getElementById('btn-about');

    // --- 2. 定义我们的“魔法” (核心函数) ---

    // 凤凰系统密钥
    const PHOENIX_API_KEY = "PHOENIX-API-KEY!";
    const PHOENIX_API_IV = "PHOENIX-API-IV!!";
    const PHOENIX_RULE_KEY = "PHOENIX-RULE-KEY";
    const PHOENIX_RULE_IV = "PHOENIX-RULE-IV!";

    // 生成随机字符串
    function randomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // 字符串转Hex
    function strToHex(str) {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            let charCode = str.charCodeAt(i).toString(16);
            hex += charCode.length < 2 ? '0' + charCode : charCode;
        }
        return hex;
    }

    // AES 加密 (返回 Base64)
    function encryptAes(data, key, iv) {
        const keyHex = CryptoJS.enc.Utf8.parse(key);
        const ivHex = CryptoJS.enc.Utf8.parse(iv);
        const encrypted = CryptoJS.AES.encrypt(data, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        return encrypted.toString();
    }

    // AES 解密 (从 Base64)
    function decryptAes(ciphertext, key, iv) {
        try {
            const keyHex = CryptoJS.enc.Utf8.parse(key);
            const ivHex = CryptoJS.enc.Utf8.parse(iv);
            const decrypted = CryptoJS.AES.decrypt(ciphertext, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) { return null; }
    }

    // T4 线路仓加密
    function encryptVod(plaintext) {
        try {
            const key = randomString(16);
            const realIv = randomString(13);
            let aesIv = realIv;
            while (aesIv.length < 16) { aesIv += "0"; }

            const keyHex = CryptoJS.enc.Utf8.parse(key);
            const ivHex = CryptoJS.enc.Utf8.parse(aesIv);
            const encrypted = CryptoJS.AES.encrypt(plaintext, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            const encryptedHex = CryptoJS.enc.Hex.stringify(encrypted.ciphertext);

            const prefix = randomString(10) + "$#" + key + "#$" + randomString(10);
            const headerWithIv = prefix + realIv;
            const headerHex = strToHex(headerWithIv);
            const footerHex = strToHex(randomString(13));

            return "2423" + headerHex + "2324" + encryptedHex + footerHex;
        } catch (e) {
            console.error("Encrypt VOD Error:", e);
            return null;
        }
    }
    
    // 简单的 Toast 提示
    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:10px 20px; border-radius:5px; z-index:1000; transition: opacity 0.5s;';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { document.body.removeChild(toast); }, 500);
        }, 2000);
    }

    // --- 3. 把“灵魂”注入“骨架” (绑定事件) ---

    btnPaste.addEventListener('click', () => {
        navigator.clipboard.readText().then(text => {
            mainInput.value = text;
            showToast('已从剪贴板粘贴');
        }).catch(err => showToast('粘贴失败，浏览器可能不支持或未授权'));
    });

    btnCopy.addEventListener('click', () => {
        if (!mainInput.value) return;
        navigator.clipboard.writeText(mainInput.value).then(() => {
            showToast('结果已复制到剪贴板');
        });
    });

    btnClear.addEventListener('click', () => {
        mainInput.value = "";
    });

    btnEncryptVod.addEventListener('click', () => {
        const result = encryptVod(mainInput.value);
        if (result) {
            mainInput.value = result;
            showToast('双重加密成功！');
        } else {
            showToast('加密失败，请检查输入！');
        }
    });
    
    // ... 其他按钮的事件绑定，我们先留空 ...
    btnDecryptVod.addEventListener('click', () => showToast('解密功能待实现...'));
    btnCreateImage.addEventListener('click', () => showToast('生成图片功能待实现...'));
    
    btnEncryptAct.addEventListener('click', () => {
        mainInput.value = encryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV);
        showToast('激活码加密成功！');
    });
    
    btnDecryptAct.addEventListener('click', () => {
        const result = decryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV);
        if(result) mainInput.value = result; else showToast('解密失败！');
    });

    btnEncryptRule.addEventListener('click', () => {
        mainInput.value = encryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV);
        showToast('规则加密成功！');
    });

    btnDecryptRule.addEventListener('click', () => {
        const result = decryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV);
        if(result) mainInput.value = result; else showToast('解密失败！');
    });

    btnMd5.addEventListener('click', () => {
        mainInput.value = CryptoJS.MD5(mainInput.value).toString();
        showToast('MD5计算完成！');
    });

    btnAbout.addEventListener('click', () => {
        alert('Designed & Developed by 下一站幸福 & 婉儿 ❤️');
    });

});
