plugins {
    id("com.android.application")
}

// Assinatura de release: só via variáveis de ambiente (segredos do GitHub Actions).
// Nunca versione o keystore nem as senhas.
val keystorePath: String? = System.getenv("DOJO_KEYSTORE_PATH")
val hasReleaseKey = !keystorePath.isNullOrBlank() && file(keystorePath).exists()

android {
    namespace = "io.github.souproxy.dojo"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.github.souproxy.dojo"
        minSdk = 26
        targetSdk = 35
        versionCode = (System.getenv("DOJO_VERSION_CODE") ?: "1").toInt()
        versionName = "1.3.0"
    }

    signingConfigs {
        if (hasReleaseKey) {
            create("release") {
                storeFile = file(keystorePath!!)
                storePassword = System.getenv("DOJO_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("DOJO_KEY_ALIAS")
                keyPassword = System.getenv("DOJO_KEY_PASSWORD")
                enableV2Signing = true
                enableV3Signing = true
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasReleaseKey) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        abortOnError = true
        checkReleaseBuilds = true
    }
}

dependencies {
    // Alinha kotlin-stdlib-jdk7/jdk8 (transitivas) com a stdlib e evita classes duplicadas.
    implementation(platform("org.jetbrains.kotlin:kotlin-bom:1.8.22"))
    implementation("androidx.activity:activity:1.9.3")
    implementation("androidx.core:core:1.13.1")
    implementation("androidx.webkit:webkit:1.12.1")
}
