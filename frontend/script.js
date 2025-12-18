document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('fraudForm');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('resultSection');
    const loader = document.getElementById('loader');
    const btnText = analyzeBtn.querySelector('.btn-text');
    const resetBtn = document.getElementById('resetBtn');

    // Batch UI Elements
    const showSingleBtn = document.getElementById('showSingleBtn');
    const showBatchBtn = document.getElementById('showBatchBtn');
    const fraudForm = document.getElementById('fraudForm');
    const batchSection = document.getElementById('batchSection');

    const dropZone = document.getElementById('dropZone');
    const csvInput = document.getElementById('csvInput');
    const fileInfo = document.getElementById('fileInfo');
    const uploadBtn = document.getElementById('uploadBtn');
    const batchLoader = document.getElementById('batchLoader');
    const batchResultSection = document.getElementById('batchResultSection');
    const batchSummary = document.getElementById('batchSummary');
    const fraudTable = document.getElementById('fraudTable').querySelector('tbody');
    const resetBatchBtn = document.getElementById('resetBatchBtn');

    let selectedFile = null;

    // --- Toggle Views ---
    showSingleBtn.addEventListener('click', () => {
        showSingleBtn.classList.add('active');
        showBatchBtn.classList.remove('active');
        fraudForm.classList.remove('hidden');
        batchSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        batchResultSection.classList.add('hidden');
    });

    showBatchBtn.addEventListener('click', () => {
        showBatchBtn.classList.add('active');
        showSingleBtn.classList.remove('active');
        batchSection.classList.remove('hidden');
        fraudForm.classList.add('hidden');
        resultSection.classList.add('hidden');
        batchResultSection.classList.add('hidden');
    });

    // --- Single Prediction Reset ---
    resetBtn.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        fraudForm.classList.remove('hidden');
        fraudForm.reset();
    });

    // --- Single Prediction Submit ---
    fraudForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI Loading State
        btnText.style.display = 'none';
        loader.style.display = 'block';
        analyzeBtn.disabled = true;

        // Collect Data
        const formData = {
            transaction_type: document.getElementById('transaction_type').value,
            amount: parseFloat(document.getElementById('amount').value),
            merchant_category: document.getElementById('merchant_category').value,
            sender_bank: document.getElementById('sender_bank').value,
            receiver_bank: document.getElementById('receiver_bank').value,
            device_type: document.getElementById('device_type').value,
            network_type: document.getElementById('network_type').value
        };

        try {
            // API Call
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Simulate slight delay for "analysis" feel
            setTimeout(() => {
                showResult(data);
            }, 800);

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during analysis. Please try again.');
            resetButton();
        }
    });

    // --- Batch Upload Logic ---
    dropZone.addEventListener('click', () => csvInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    csvInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
            alert("Please upload a Valid CSV file.");
            return;
        }
        selectedFile = file;
        fileInfo.textContent = `Selected: ${file.name}`;
        fileInfo.style.color = "var(--text)";
        uploadBtn.disabled = false;
    }

    uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        // UI Loading
        const btnSpan = uploadBtn.querySelector('.btn-text');
        btnSpan.style.display = 'none';
        batchLoader.style.display = 'block';
        uploadBtn.disabled = true;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/upload_csv', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Upload failed');
            }

            const data = await response.json();

            setTimeout(() => {
                showBatchResult(data);
                resetUploadButton();
            }, 1000);

        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
            resetUploadButton();
        }
    });

    function showBatchResult(data) {
        batchSection.classList.add('hidden');
        batchResultSection.classList.remove('hidden');

        batchSummary.innerHTML = `Processed <b>${data.total_processed}</b> transactions. found <b style="color: var(--danger)">${data.fraud_count}</b> frauds.`;

        fraudTable.innerHTML = ''; // Clear previous

        if (data.fraud_count === 0) {
            fraudTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Fraud Detected! ✅</td></tr>';
        } else {
            data.frauds.forEach(fraud => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${fraud['transaction id'] || '-'}</td>
                    <td>${fraud['transaction type']}</td>
                    <td>₹${fraud['amount (INR)']}</td>
                    <td>${fraud['sender_bank'] || '-'}</td>
                    <td style="color: var(--danger); font-weight: bold;">${fraud.fraud_prob}</td>
                `;
                fraudTable.appendChild(row);
            });
        }
    }

    resetBatchBtn.addEventListener('click', () => {
        batchResultSection.classList.add('hidden');
        batchSection.classList.remove('hidden');
        resetUploadButton();
        fileInfo.textContent = "No file selected";
        csvInput.value = '';
        selectedFile = null;
        uploadBtn.disabled = true;
    });

    function resetUploadButton() {
        const btnSpan = uploadBtn.querySelector('.btn-text');
        btnSpan.style.display = 'block';
        batchLoader.style.display = 'none';
        uploadBtn.disabled = false;
    }

    // --- Helper Functions ---

    function showResult(data) {
        // Hide Form, Show Result
        fraudForm.classList.add('hidden');
        resultSection.classList.remove('hidden');
        resetButton();

        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        const progressFill = document.getElementById('progressFill');
        const scoreValue = document.getElementById('scoreValue');

        const probabilityPercent = (data.fraud_probability * 100).toFixed(1);

        if (data.prediction === 'Fraudulent') {
            resultIcon.innerHTML = '🚨';
            resultTitle.innerHTML = 'Fraud Alert Detected';
            resultTitle.style.color = 'var(--danger)';
            resultMessage.innerHTML = 'This transaction exhibits patterns consistent with fraudulent activity.';
            progressFill.style.backgroundColor = 'var(--danger)';
        } else {
            resultIcon.innerHTML = '✅';
            resultTitle.innerHTML = 'Transaction Legitimate';
            resultTitle.style.color = 'var(--success)';
            resultMessage.innerHTML = 'This transaction appears safe and follows normal patterns.';
            progressFill.style.backgroundColor = 'var(--success)';
        }

        // Animate Bar
        setTimeout(() => {
            progressFill.style.width = `${probabilityPercent}%`;
            scoreValue.innerHTML = `${probabilityPercent}% Risk`;
        }, 100);
    }

    function resetButton() {
        btnText.style.display = 'block';
        loader.style.display = 'none';
        analyzeBtn.disabled = false;
    }
});
