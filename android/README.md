<manifest package="com.example.multitenant" xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:label="MultiTenement"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar">

        <activity android:name=".AddTenantActivity" />
        <activity android:name=".MainActivity" />
        <activity android:name=".LoginActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>

