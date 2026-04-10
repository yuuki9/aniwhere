# Build
FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /app

COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle gradle
COPY src src

RUN chmod +x gradlew \
    && ./gradlew bootJar --no-daemon \
    && cp "build/libs/$(ls build/libs | grep -v plain | head -n1)" /app/application.jar

# Run
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app app
COPY --from=builder /app/application.jar app.jar
RUN chown app:app app.jar

USER app
EXPOSE 8080

# Pass DB_* and other env at runtime (see .env.example)
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
