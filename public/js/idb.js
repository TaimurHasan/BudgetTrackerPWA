let db;

const request = indexedDB.open('transactions', 1)

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon successful request
request.onsuccess = function(event) {
    db = event.target.result;

    if(navigator.onLine) {
        uploadRecord();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(trans) {
    // open a transaction
    const db_transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for new_transaction
    const transObjectStore = db_transaction.objectStore('new_transaction');

    // add transaction to idb store
    transObjectStore.add(trans);
};

function uploadRecord() {
    // open a transaction
    const db_transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for new_transaction
    const transObjectStore = db_transaction.objectStore('new_transaction');

    // get all existing transactions from idb
    const getAll = transObjectStore.getAll();

    getAll.onsuccess = function () {
        // if data in idb store, send it to api server
        if(getAll.result.length > 0) {
            // insert fetch request to post transaction
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                return response.json();
            })
            .then(data => {
                if(data.message) {
                    throw new Error(data);
                };

                // clear data from indexeddb once loaded successfully through fetch request
                const db_transaction = db.transaction(['new_transaction'], 'readwrite');
                const transObjectStore = db_transaction.objectStore('new_transaction');
                transObjectStore.clear();
                alert('All transactions have been submitted');
                document.location.reload();
            })
            .catch(err => {
                console.log(err)
            })
        }
    }
};

// upload transaction when user goes online
window.addEventListener('online', uploadRecord);

