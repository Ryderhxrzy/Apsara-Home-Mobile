package com.afhome.mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.RemoteViews
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager

class MyOrdersWidgetProvider : AppWidgetProvider() {
    companion object {
        private const val TAG = "MyOrdersWidget"
        const val ACTION_UPDATE_WIDGET = "com.afhome.mobile.UPDATE_MY_ORDERS_WIDGET"
        const val ACTION_REFRESH = "com.afhome.mobile.REFRESH_MY_ORDERS_WIDGET"
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        Log.d(TAG, "onUpdate called for widget IDs: ${appWidgetIds.joinToString()}")

        for (widgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_REFRESH -> {
                Log.d(TAG, "Refresh action received")
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = ComponentName(context, MyOrdersWidgetProvider::class.java)
                val widgetIds = appWidgetManager.getAppWidgetIds(componentName)

                for (widgetId in widgetIds) {
                    updateWidget(context, appWidgetManager, widgetId)
                }
            }
            ACTION_UPDATE_WIDGET -> {
                Log.d(TAG, "Update widget action received")
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = ComponentName(context, MyOrdersWidgetProvider::class.java)
                val widgetIds = appWidgetManager.getAppWidgetIds(componentName)

                for (widgetId in widgetIds) {
                    updateWidget(context, appWidgetManager, widgetId)
                }
            }
        }
    }

    private fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, widgetId: Int) {
        Log.d(TAG, "Updating widget: $widgetId")

        val views = RemoteViews(context.packageName, R.layout.widget_my_orders)

        try {
            val ordersData = MyOrdersWidgetService.getRecentOrders(context)
            Log.d(TAG, "Fetched ${ordersData.size} recent orders from backend")

            if (ordersData.isNotEmpty()) {
                // Display up to 2 recent orders
                for ((index, order) in ordersData.take(2).withIndex()) {
                    val orderNum = index + 1
                    val orderNumId = context.resources.getIdentifier("order_num_$orderNum", "id", context.packageName)
                    val statusId = context.resources.getIdentifier("order_status_$orderNum", "id", context.packageName)
                    val itemNameId = context.resources.getIdentifier("item_name_$orderNum", "id", context.packageName)
                    val amountId = context.resources.getIdentifier("order_amount_$orderNum", "id", context.packageName)
                    val dateId = context.resources.getIdentifier("order_date_$orderNum", "id", context.packageName)

                    views.setTextViewText(orderNumId, "Order #${order.orderNumber.take(8)}")
                    views.setTextViewText(statusId, order.status.uppercase())
                    views.setTextViewText(itemNameId, order.itemName)
                    views.setTextViewText(amountId, "₱${String.format("%.2f", order.totalAmount)}")
                    views.setTextViewText(dateId, order.date)

                    // Set status color based on order status
                    val statusColor = getStatusColor(order.status)
                    views.setTextColor(statusId, statusColor)
                }
            } else {
                Log.w(TAG, "No recent orders found - showing empty state")
                views.setTextViewText(R.id.empty_state_text, "No orders yet")
                views.setViewVisibility(R.id.orders_container, android.view.View.GONE)
                views.setViewVisibility(R.id.empty_state, android.view.View.VISIBLE)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error loading order data: ${e.message}", e)
            views.setTextViewText(R.id.empty_state_text, "Unable to load orders")
            views.setViewVisibility(R.id.orders_container, android.view.View.GONE)
            views.setViewVisibility(R.id.empty_state, android.view.View.VISIBLE)
        }

        // Add click intent to open the app
        val intent = Intent(context, MainActivity::class.java)
        intent.putExtra("openOrders", true)
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

        appWidgetManager.updateAppWidget(widgetId, views)
        Log.d(TAG, "Widget $widgetId updated successfully")
    }

    private fun getStatusColor(status: String): Int {
        return when (status.lowercase()) {
            "pending" -> 0xFFEF4444.toInt()
            "paid" -> 0xFF06B6D4.toInt()
            "processing" -> 0xFFF59E0B.toInt()
            "shipped" -> 0xFF3B82F6.toInt()
            "to_receive" -> 0xFF8B5CF6.toInt()
            "delivered" -> 0xFF10B981.toInt()
            "cancelled" -> 0xFFEF4444.toInt()
            else -> 0xFF666666.toInt()
        }
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        Log.d(TAG, "Widget enabled")
        scheduleWidgetUpdates(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        Log.d(TAG, "Widget disabled")
    }

    private fun scheduleWidgetUpdates(context: Context) {
        val updateWorkRequest = OneTimeWorkRequestBuilder<MyOrdersWidgetUpdateWorker>()
            .build()
        WorkManager.getInstance(context).enqueue(updateWorkRequest)
    }
}
