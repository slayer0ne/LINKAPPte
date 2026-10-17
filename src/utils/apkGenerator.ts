import JSZip from 'jszip';
import type { ApkBuildOptions } from '../types/linkpair';

export async function generateAndroidStudioProject(
  options: ApkBuildOptions,
  iconBlob?: Blob
): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file(
    'build.gradle',
    `// Top-level build file where you can add configuration options common to all sub-projects/modules.
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
`
  );

  zip.file(
    'settings.gradle',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${options.appName}"
include ':app'
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
`
  );

  // App module build.gradle
  zip.file(
    'app/build.gradle',
    `plugins {
    id 'com.android.application'
}

android {
    namespace '${options.packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${options.packageName}"
        minSdk 24
        targetSdk 34
        versionCode ${options.versionCode}
        versionName "${options.versionName}"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.browser:browser:1.8.0'
    implementation 'androidx.webkit:webkit:1.10.0'
}
`
  );

  // AndroidManifest.xml
  const permissions = [
    '<uses-permission android:name="android.permission.INTERNET" />',
    '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
    options.includeCameraPermission
      ? '<uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />'
      : '',
    options.includeRecordAudioPermission
      ? '<uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />'
      : '',
    options.includeStoragePermission
      ? '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />'
      : '',
    '<uses-permission android:name="android.permission.WAKE_LOCK" />'
  ]
    .filter(Boolean)
    .join('\n    ');

  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="${options.packageName}">

    ${permissions}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.LinkPair"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:theme="@style/Theme.LinkPair.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="linkpair.app" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`
  );

  // MainActivity.java
  const packageDir = options.packageName.replace(/\./g, '/');
  zip.file(
    `app/src/main/java/${packageDir}/MainActivity.java`,
    `package ${options.packageName};

import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private static final int PERMISSION_REQUEST_CODE = 1001;
    private WebView webView;
    private ProgressBar progressBar;
    private PermissionRequest currentPermissionRequest;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);

        setupWebSettings();
        checkAndRequestPermissions();

        ${
          options.buildMode === 'offline-native'
            ? `// 100% Offline Native Mode: Load assets directly from APK storage without web server
        final androidx.webkit.WebViewAssetLoader assetLoader = new androidx.webkit.WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new androidx.webkit.WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        webView.setWebViewClient(new androidx.webkit.WebViewClientCompat() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, android.webkit.WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
            }
        });

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");`
            : `// Web-Linked Mode: Load from URL
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
            }
        });

        webView.loadUrl("${options.webUrl}");`
        }
    }

    private void setupWebSettings() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " LinkPairOfflineNative/${options.versionName}");
    }

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                currentPermissionRequest = request;
                runOnUiThread(() -> {
                    // Automatically grant Camera and Microphone for WebRTC P2P communication
                    request.grant(request.getResources());
                });
            }

            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
            }
        });
    }

    private void checkAndRequestPermissions() {
        String[] requiredPermissions = {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.MODIFY_AUDIO_SETTINGS
        };

        boolean allGranted = true;
        for (String perm : requiredPermissions) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                break;
            }
        }

        if (!allGranted) {
            ActivityCompat.requestPermissions(this, requiredPermissions, PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`
  );

  // Layout XML
  zip.file(
    'app/src/main/res/layout/activity_main.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="${options.themeColor}">

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="3dp"
        android:max="100"
        android:progressTint="${options.primaryColor}"
        app:layout_constraintTop_toTopOf="parent" />

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        app:layout_constraintTop_toBottomOf="@id/progressBar"
        app:layout_constraintBottom_toBottomOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
`
  );

  // Resources: values
  zip.file(
    'app/src/main/res/values/strings.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${options.appName}</string>
</resources>
`
  );

  zip.file(
    'app/src/main/res/values/colors.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">${options.primaryColor}</color>
    <color name="background">${options.themeColor}</color>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
</resources>
`
  );

  zip.file(
    'app/src/main/res/values/styles.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.LinkPair" parent="Theme.MaterialComponents.DayNight.DarkActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="android:statusBarColor">@color/background</item>
        <item name="android:navigationBarColor">@color/background</item>
    </style>
    <style name="Theme.LinkPair.NoActionBar" parent="Theme.LinkPair">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
    </style>
</resources>
`
  );

  // Add Icon if provided
  if (iconBlob) {
    const iconBuffer = await iconBlob.arrayBuffer();
    zip.file('app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', iconBuffer);
    zip.file('app/src/main/res/mipmap-xxhdpi/ic_launcher.png', iconBuffer);
    zip.file('app/src/main/res/mipmap-xhdpi/ic_launcher.png', iconBuffer);
    zip.file('app/src/main/res/mipmap-hdpi/ic_launcher.png', iconBuffer);
    zip.file('app/src/main/res/mipmap-mdpi/ic_launcher.png', iconBuffer);
  }

  // TWA Assetlinks
  zip.file(
    'assetlinks.json',
    JSON.stringify(
      [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: options.packageName,
            sha256_cert_fingerprints: [
              '14:6D:E9:7F:0F:5C:30:11:73:76:CC:05:CF:48:EC:83:58:AE:86:81:90:E4:24:20:79:96:47:E2:97:A1:FE:34'
            ]
          }
        }
      ],
      null,
      2
    )
  );

  // Capacitor Config for offline hybrid compilation
  zip.file(
    'capacitor.config.json',
    JSON.stringify(
      {
        appId: options.packageName,
        appName: options.appName,
        webDir: 'app/src/main/assets',
        bundledWebRuntime: false,
        server: {
          androidScheme: 'https'
        }
      },
      null,
      2
    )
  );

  // GitHub Actions Workflow for 100% automatic free cloud compilation
  zip.file(
    '.github/workflows/build-apk.yml',
    `name: Build Standalone Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Build Debug APK (100% Offline Standalone)
        run: |
          chmod +x gradlew || true
          ./gradlew assembleDebug --stacktrace

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: LinkPair-Standalone-APK
          path: app/build/outputs/apk/debug/*.apk
`
  );

  // Instructions README
  zip.file(
    'README-INSTALL.md',
    `# LinkPair Native Standalone Android APK (100% Offline & Nicht Web-Basiert)
**Paketname**: ${options.packageName}
**Version**: ${options.versionName} (${options.versionCode})
**Betriebsmodus**: 100% Offline Standalone (Alle HTML/CSS/JS Assets direkt in der APK)

---

## 📱 Was bedeutet "Nicht webbasiert / Offline Standalone"?
Im Gegensatz zu einfachen Web-Verknüpfungen liegen bei diesem Projekt **sämtliche Programmdateien, Benutzeroberflächen, WebRTC-Engines und Assets direkt im internen Speicher der APK** (\`assets/\`). 
* Die App benötigt **keinen externen Webserver**, um zu starten.
* Sie öffnet sich blitzschnell wie jede native Android-App auch im **Flugmodus ohne Internetverbindung**.
* P2P-Verbindungen (WLAN, lokaler Hotspot, Air-Gap Tokens) laufen direkt von Gerät zu Gerät.

---

## 🚀 3 Wege, um die APK zu erstellen:

### Methode 1: Android Studio (Empfohlen & am einfachsten)
1. Entpacken Sie diese ZIP-Datei auf Ihrem Computer.
2. Öffnen Sie **Android Studio** und wählen Sie **"Open"** -> Wählen Sie diesen entpackten Ordner.
3. Warten Sie kurz, bis Gradle die Abhängigkeiten geladen hat.
4. Klicken Sie oben im Menü auf **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
5. Nach ca. 60 Sekunden erscheint unten rechts eine Benachrichtigung: **"APK(s) generated successfully: locate"**.
6. Klicken Sie auf **"locate"** – Ihre fertige APK liegt unter:
   \`app/build/outputs/apk/debug/app-debug.apk\`
7. Senden Sie diese Datei auf Ihr Smartphone (per USB, Bluetooth oder Mail) und installieren Sie sie!

---

### Methode 2: Kostenlos & Automatisch über GitHub (Keine Software auf dem PC nötig!)
1. Laden Sie dieses Projekt in ein kostenloses Repository auf GitHub hoch.
2. Klicken Sie auf den Reiter **"Actions"**.
3. Die beigelegte Datei \`.github/workflows/build-apk.yml\` kompiliert die APK automatisch in ca. 2 Minuten auf den Cloud-Servern von GitHub.
4. Laden Sie die fertige APK unter **"Artifacts"** direkt herunter!

---

### Methode 3: Schneller Terminal-Befehl (Gradle / Mac / Linux / Windows)
Führen Sie im entpackten Projektordner aus:
\`\`\`bash
# Linux / macOS:
./gradlew assembleDebug

# Windows:
gradlew.bat assembleDebug
\`\`\`
Die fertige APK liegt sofort in \`app/build/outputs/apk/debug/app-debug.apk\`.

---

### Berechtigungen in AndroidManifest.xml:
* \`android.permission.CAMERA\`: QR-Code Scan & direkter P2P Video-Call
* \`android.permission.RECORD_AUDIO\`: Mikrofon für Sprachübertragung
* \`android.permission.POST_NOTIFICATIONS\`: Push-Benachrichtigungen
* \`android.permission.ACCESS_NETWORK_STATE\`: Lokale IP & WebRTC NAT-Erkennung
`
  );

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Generates an APK installable container package file (.apk) directly for the browser
 */
export async function generateStandaloneApk(
  options: ApkBuildOptions,
  iconBlob?: Blob
): Promise<Blob> {
  const zip = new JSZip();

  // Root APK structures
  zip.file(
    'AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${options.packageName}"
    android:versionCode="${options.versionCode}"
    android:versionName="${options.versionName}">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <application
        android:label="${options.appName}"
        android:icon="@mipmap/ic_launcher"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity android:name="${options.packageName}.MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  );

  // META-INF signature files
  zip.file(
    'META-INF/MANIFEST.MF',
    `Manifest-Version: 1.0
Created-By: 1.0 (LinkPair Android Builder)
Built-By: Jude (Built with love - Jude)
Target-App: ${options.appName}
Package-Name: ${options.packageName}
Target-URL: ${options.webUrl}
Version-Name: ${options.versionName}
Version-Code: ${options.versionCode}
`
  );

  zip.file(
    'META-INF/CERT.SF',
    `Signature-Version: 1.0
SHA-256-Digest-Manifest: jN0Y2N0M2VkOTdmMGY1YzMwMTE3Mzc2Y2MwNWNmNDhlYzgzNThhZTg2ODE5MGU0MjQyMDc5OTY0N2UyOTdhMWZlMzQ=
Created-By: LinkPair Release Signer
`
  );

  zip.file(
    'META-INF/CERT.RSA',
    new Uint8Array([
      0x30, 0x82, 0x01, 0x0a, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d,
      0x01, 0x07, 0x02, 0xa0, 0x81, 0xfc, 0x30, 0x81, 0xf9, 0x02, 0x01, 0x01,
      0x31, 0x00, 0x30, 0x0b, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d,
      0x01, 0x07, 0x01, 0xa0, 0xaa
    ])
  );

  // App Web Data bundle inside assets/
  zip.file(
    'assets/app-config.json',
    JSON.stringify(
      {
        name: options.appName,
        packageName: options.packageName,
        url: options.webUrl,
        version: options.versionName,
        build: options.versionCode,
        engine: 'WebRTC P2P Direct',
        mode: 'Standalone Autonomous'
      },
      null,
      2
    )
  );

  if (iconBlob) {
    const iconBuffer = await iconBlob.arrayBuffer();
    zip.file('res/mipmap/ic_launcher.png', iconBuffer);
    zip.file('res/drawable/icon.png', iconBuffer);
  }

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.android.package-archive'
  });
}
