package com.neobit.crm.di

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.neobit.crm.BuildConfig
import com.neobit.crm.data.api.AIApiService
import com.neobit.crm.data.api.CRMApiService
import com.neobit.crm.data.local.TokenManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Named
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }
    
    @Provides
    @Singleton
    fun provideAuthInterceptor(tokenManager: TokenManager): Interceptor {
        return Interceptor { chain ->
            val token = runBlocking { tokenManager.accessToken.first() }
            val request = chain.request().newBuilder().apply {
                if (token != null) {
                    addHeader("Authorization", "Bearer $token")
                }
                addHeader("Content-Type", "application/json")
            }.build()
            chain.proceed(request)
        }
    }
    
    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: Interceptor): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) {
                    HttpLoggingInterceptor.Level.BODY
                } else {
                    HttpLoggingInterceptor.Level.NONE
                }
            })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }
    
    @Provides
    @Singleton
    @Named("crm")
    fun provideCRMRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }
    
    @Provides
    @Singleton
    @Named("ai")
    fun provideAIRetrofit(okHttpClient: OkHttpClient): Retrofit {
        val aiBaseUrl = BuildConfig.API_BASE_URL.replace(":8080", ":8001").replace("/api", "")
        return Retrofit.Builder()
            .baseUrl("$aiBaseUrl/")
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }
    
    @Provides
    @Singleton
    fun provideCRMApiService(@Named("crm") retrofit: Retrofit): CRMApiService {
        return retrofit.create(CRMApiService::class.java)
    }
    
    @Provides
    @Singleton
    fun provideAIApiService(@Named("ai") retrofit: Retrofit): AIApiService {
        return retrofit.create(AIApiService::class.java)
    }
}

