// Simple IndexedDB wrapper for offline orders
const DB_NAME = "ChistoDB"
const DB_VERSION = 1
const STORE_NAME = "offlineOrders"

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const saveOrderOffline = async (orderData) => {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    
    // Add timestamp to the offline order
    const dataToSave = { ...orderData, queuedAt: new Date().toISOString() }
    store.add(dataToSave)
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error)
    })
  } catch (error) {
    console.error("IndexedDB Save Error:", error)
    return false
  }
}

export const getOfflineOrders = async () => {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("IndexedDB Get Error:", error)
    return []
  }
}

export const clearOfflineOrder = async (id) => {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    store.delete(id)
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error)
    })
  } catch (error) {
    console.error("IndexedDB Delete Error:", error)
    return false
  }
}
