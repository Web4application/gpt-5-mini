cmake_minimum_required(VERSION 3.19)
project(runner LANGUAGES CXX)

set(BINARY_NAME "diagram_viewer")
set(APPLICATION_ID "com.example.diagram_viewer")

cmake_policy(SET CMP0063 NEW)
set(CMAKE_INSTALL_RPATH "$ORIGIN/lib")

# Sysroot (for cross-builds)
if(FLUTTER_TARGET_PLATFORM_SYSROOT)
  set(CMAKE_SYSROOT ${FLUTTER_TARGET_PLATFORM_SYSROOT})
endif()

# Flutter
set(FLUTTER_MANAGED_DIR "${CMAKE_CURRENT_SOURCE_DIR}/flutter")
add_subdirectory(${FLUTTER_MANAGED_DIR})

# Runner
add_executable(${BINARY_NAME} "main.cc")
target_link_libraries(${BINARY_NAME} PRIVATE flutter)

# GTK / GLib
find_package(PkgConfig REQUIRED)
pkg_check_modules(GTK REQUIRED gtk+-3.0)
pkg_check_modules(GLIB REQUIRED glib-2.0 gobject-2.0 gio-2.0)

target_include_directories(${BINARY_NAME} PRIVATE
  ${GTK_INCLUDE_DIRS} ${GLIB_INCLUDE_DIRS}
)
target_link_libraries(${BINARY_NAME} PRIVATE
  ${GTK_LIBRARIES} ${GLIB_LIBRARIES}
)

# Install binary
install(TARGETS ${BINARY_NAME} RUNTIME DESTINATION bin)

# Desktop integration
set(DESKTOP_FILE "${CMAKE_CURRENT_SOURCE_DIR}/${BINARY_NAME}.desktop")
set(ICON_FILE    "${CMAKE_CURRENT_SOURCE_DIR}/icons/${BINARY_NAME}.png")

install(FILES ${DESKTOP_FILE} DESTINATION share/applications)
install(FILES ${ICON_FILE} DESTINATION share/icons/hicolor/128x128/apps)
