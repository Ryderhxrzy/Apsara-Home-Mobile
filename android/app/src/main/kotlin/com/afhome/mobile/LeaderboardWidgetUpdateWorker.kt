package com.afhome.mobile

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

class LeaderboardWidgetUpdateWorker(
    context: Context,
    params: WorkerParameters
) : Worker(context, params) {
    companion object {
        private const val TAG = "WidgetUpdateWorker"
    }

    override fun doWork(): Result {
        return try {
            Log.d(TAG, "Updating widgets...")

            val appWidgetManager = AppWidgetManager.getInstance(applicationContext)
            val componentName = ComponentName(applicationContext, LeaderboardWidgetProvider::class.java)
            val widgetIds = appWidgetManager.getAppWidgetIds(componentName)

            if (widgetIds.isNotEmpty()) {
                Log.d(TAG, "Found ${widgetIds.size} widgets to update")
                val provider = LeaderboardWidgetProvider()
                provider.onUpdate(applicationContext, appWidgetManager, widgetIds)
            } else {
                Log.d(TAG, "No widgets found to update")
            }

            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error updating widgets: ${e.message}", e)
            Result.retry()
        }
    }
}
