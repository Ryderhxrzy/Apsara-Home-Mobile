package com.afhome.mobile

import android.content.Context
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject
import java.net.URL
import javax.net.ssl.HttpsURLConnection

class MyOrdersWidgetService {
    companion object {
        private const val TAG = "MyOrdersWidgetService"
        private const val CACHE_PREFS = "widget_cache"
        private const val CACHE_KEY = "recent_orders"
        private var cachedData: List<OrderData>? = null

        data class OrderData(
            val orderNumber: String,
            val status: String,
            val itemName: String,
            val totalAmount: Double,
            val date: String
        )

        fun getRecentOrders(context: Context): List<OrderData> {
            return try {
                val token = getTokenFromSharedPreferences(context)
                if (token.isNullOrEmpty()) {
                    Log.w(TAG, "No auth token found, using cached data")
                    return getCachedData(context)
                }

                val data = fetchOrdersFromBackend(token)
                if (data.isNotEmpty()) {
                    cachedData = data
                    saveCacheToPrefs(context, data)
                    Log.d(TAG, "Orders fetched and cached: ${data.size} orders")
                    data
                } else {
                    Log.w(TAG, "Empty orders returned, using cache")
                    getCachedData(context)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading orders: ${e.message}, using cache")
                getCachedData(context)
            }
        }

        private fun getCachedData(context: Context): List<OrderData> {
            // Try in-memory cache first
            if (cachedData != null && cachedData!!.isNotEmpty()) {
                Log.d(TAG, "Using in-memory cache: ${cachedData!!.size} orders")
                return cachedData!!
            }

            // Try SharedPreferences cache
            val prefs = context.getSharedPreferences(CACHE_PREFS, 0)
            val cachedJson = prefs.getString(CACHE_KEY, null)
            if (cachedJson != null) {
                try {
                    val jsonArray = JSONArray(cachedJson)
                    val data = mutableListOf<OrderData>()
                    for (i in 0 until jsonArray.length()) {
                        val obj = jsonArray.getJSONObject(i)
                        data.add(
                            OrderData(
                                orderNumber = obj.getString("orderNumber"),
                                status = obj.getString("status"),
                                itemName = obj.getString("itemName"),
                                totalAmount = obj.getDouble("totalAmount"),
                                date = obj.getString("date")
                            )
                        )
                    }
                    cachedData = data
                    Log.d(TAG, "Using SharedPreferences cache: ${data.size} orders")
                    return data
                } catch (e: Exception) {
                    Log.e(TAG, "Error reading cached data: ${e.message}")
                }
            }

            Log.w(TAG, "No cached data available")
            return emptyList()
        }

        private fun saveCacheToPrefs(context: Context, data: List<OrderData>) {
            try {
                val jsonArray = JSONArray()
                for (order in data) {
                    val obj = JSONObject()
                    obj.put("orderNumber", order.orderNumber)
                    obj.put("status", order.status)
                    obj.put("itemName", order.itemName)
                    obj.put("totalAmount", order.totalAmount)
                    obj.put("date", order.date)
                    jsonArray.put(obj)
                }
                val prefs = context.getSharedPreferences(CACHE_PREFS, 0)
                prefs.edit().putString(CACHE_KEY, jsonArray.toString()).apply()
            } catch (e: Exception) {
                Log.e(TAG, "Error saving cache: ${e.message}")
            }
        }

        private fun fetchOrdersFromBackend(token: String): List<OrderData> = runBlocking {
            try {
                val url = URL("https://backend.afhome.ph/api/orders/history")
                val connection = url.openConnection() as HttpsURLConnection
                connection.apply {
                    requestMethod = "GET"
                    setRequestProperty("Authorization", "Bearer $token")
                    setRequestProperty("Accept", "application/json")
                    setRequestProperty("User-Agent", "AFHomeWidget/1.0")
                    connectTimeout = 15000
                    readTimeout = 15000
                }

                if (connection.responseCode == HttpsURLConnection.HTTP_OK) {
                    val response = connection.inputStream.bufferedReader().readText()
                    val jsonObject = JSONObject(response)
                    val jsonArray = jsonObject.optJSONArray("orders") ?: JSONArray()

                    val orders = mutableListOf<OrderData>()
                    for (i in 0 until jsonArray.length()) {
                        val orderObj = jsonArray.getJSONObject(i)

                        // Get first item from order
                        val itemsArray = orderObj.optJSONArray("items") ?: JSONArray()
                        val itemName = if (itemsArray.length() > 0) {
                            val firstItem = itemsArray.getJSONObject(0)
                            firstItem.optString("name", "Unknown Item")
                        } else {
                            "Unknown Item"
                        }

                        val createdAt = orderObj.optString("created_at", "")
                        val displayDate = formatDate(createdAt)

                        orders.add(
                            OrderData(
                                orderNumber = orderObj.optString("order_number", "N/A"),
                                status = orderObj.optString("status", "pending"),
                                itemName = itemName,
                                totalAmount = orderObj.optDouble("total_amount", 0.0),
                                date = displayDate
                            )
                        )
                    }

                    Log.d(TAG, "Fetched ${orders.size} orders from backend")
                    orders
                } else {
                    Log.w(TAG, "Failed to fetch orders: ${connection.responseCode}")
                    emptyList()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception fetching orders: ${e.message}", e)
                emptyList()
            }
        }

        private fun formatDate(dateString: String): String {
            return try {
                val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
                val date = sdf.parse(dateString)
                val displayFormat = java.text.SimpleDateFormat("MMM d", java.util.Locale.US)
                displayFormat.format(date) ?: "Unknown"
            } catch (e: Exception) {
                "Unknown"
            }
        }

        private fun getTokenFromSharedPreferences(context: Context): String? {
            return try {
                val masterKey = MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build()

                val sharedPreferences = EncryptedSharedPreferences.create(
                    context,
                    "secure_prefs",
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                )

                sharedPreferences.getString("auth_token", null)
            } catch (e: Exception) {
                Log.e(TAG, "Error getting token from SharedPreferences: ${e.message}")
                null
            }
        }
    }
}
