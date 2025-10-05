src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"
document.addEventListener('DOMContentLoaded', function () {
  const actionButton = document.getElementById('action-button');
  const notification = document.getElementById('notification');

  let pressTimer, mediaRecorder, recordedChunks = [], isRecording = false;
  let displayStream = null;

  // ========== UTILIDAD ==========
  function showNotification(message) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => (notification.style.display = 'none'), 2500);
  }

  async function saveFile(blob, filename, kind = 'image') {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'AR capture' });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // ========== FOTO ==========
  async function screenshot() {
    try {
      actionButton.style.display = 'none'; // Oculta botón

      const canvas = await html2canvas(document.body, {
        backgroundColor: null,
        useCORS: true,
        ignoreElements: (el) => el.id === 'action-button' || el.id === 'notification',
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollX: 0,
        scrollY: 0,
      });

      actionButton.style.display = 'flex'; // Restaura botón

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const d = new Date();
      const filename = `screenshot-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}.png`;
      await saveFile(blob, filename, 'image');
      showNotification('Screenshot saved!');
    } catch (e) {
      console.error(e);
      showNotification('Error capturing screenshot');
      actionButton.style.display = 'flex';
    }
  }

  // ========== VIDEO ==========
  async function startRecording() {
    try {
      // Captura la pestaña actual (no incluye barra de direcciones)
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false,
      });

      mediaRecorder = new MediaRecorder(displayStream, { mimeType: 'video/webm' });
      recordedChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const d = new Date();
        const filename = `screenrecord-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}.webm`;
        await saveFile(blob, filename, 'video');
        showNotification('Video saved!');
      };

      mediaRecorder.start();
      isRecording = true;
      actionButton.classList.add('recording');
      showNotification('Recording...');
    } catch (err) {
      showNotification('Recording error: ' + err.message);
      console.error(err);
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      actionButton.classList.remove('recording');
      isRecording = false;
      displayStream.getTracks().forEach((t) => t.stop());
    }
  }

  // ========== EVENTOS ==========
  const pressDelay = 500;
  actionButton.addEventListener('touchstart', () => {
    pressTimer = setTimeout(startRecording, pressDelay);
  });
  actionButton.addEventListener('touchend', () => {
    clearTimeout(pressTimer);
    isRecording ? stopRecording() : screenshot();
  });
  actionButton.addEventListener('mousedown', () => {
    pressTimer = setTimeout(startRecording, pressDelay);
  });
  actionButton.addEventListener('mouseup', () => {
    clearTimeout(pressTimer);
    isRecording ? stopRecording() : screenshot();
  });
});