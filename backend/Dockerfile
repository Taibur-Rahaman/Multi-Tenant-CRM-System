# Use Java 17
FROM openjdk:17-jdk-slim

# Set workdir
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .

# Download dependencies
RUN ./mvnw dependency:go-offline || true

# Copy all project files
COPY src ./src

# Package the app
RUN ./mvnw clean package -DskipTests

# Run Spring Boot app
CMD ["java", "-jar", "target/backend-1.0-SNAPSHOT.jar"]
