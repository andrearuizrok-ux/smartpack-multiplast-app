plugins { id("com.android.application") }

android {
    namespace = "com.smartpackmultiplast.operations"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.smartpackmultiplast.operations"
        minSdk = 24
        targetSdk = 35
        versionCode = 113
        versionName = "11.3"
    }

    buildTypes {
        release { isMinifyEnabled = false }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
