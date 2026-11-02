#include <Arduino.h>

#include "../config.h"

constexpr uint32_t TASK_STACK_SIZE = 4096;

struct TaskReading {
  float potentiometer;
  float motor;
  float current;
  float power;
};

static QueueHandle_t taskQueue;
static TaskHandle_t taskHandle;
static float (*taskRead)();
static float (*taskWrite)(float);
static TaskReading taskLast;

static void RunTask(void *) {
  TaskReading reading;
  for (;;) {
    reading.potentiometer = taskRead();
    reading.motor = taskWrite(reading.potentiometer);
    reading.current = ReadIna219Milliamps();
    reading.power = ReadIna219Milliwatts();
    xQueueOverwrite(taskQueue, &reading);
    vTaskDelay(pdMS_TO_TICKS(TASK_PERIOD_MS));
  }
}

static void InitializeTask(float (*read)(), float (*write)(float)) {
  taskRead = read;
  taskWrite = write;
  taskQueue = xQueueCreate(1, sizeof(TaskReading));
  xTaskCreatePinnedToCore(RunTask, "potentiometer", TASK_STACK_SIZE, nullptr, TASK_PRIORITY, &taskHandle, TASK_CORE);
}

static bool ReceiveTask(TaskReading *reading) {
  if (xQueueReceive(taskQueue, &taskLast, pdMS_TO_TICKS(TASK_PERIOD_MS)) != pdTRUE) return false;
  *reading = taskLast;
  return true;
}

static void PrintTask() {
  Serial.printf("Potentiometer: %5.1f %% | Motor: %5.1f %% | Stack free: %u\n", taskLast.potentiometer, taskLast.motor, uxTaskGetStackHighWaterMark(taskHandle));
}
