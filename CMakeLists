cmake_minimum_required(VERSION 3.19)
project(runner LANGUAGES CXX)

set(BINARY_NAME "diagram_viewer")
set(APPLICATION_ID "com.example.diagram_viewer")

cmake_policy(SET CMP0063 NEW)
set(CMAKE_INSTALL_RPATH "$ORIGIN/lib")

# ---- Flutter / Your sources ----
# (Adjust with your actual sources if needed)
add_executable(${BINARY_NAME}
  main.cpp
)

# ---- Desktop file ----
configure_file(
  ${CMAKE_SOURCE_DIR}/${BINARY_NAME}.desktop.in
  ${CMAKE_CURRENT_BINARY_DIR}/${BINARY_NAME}.desktop
  @ONLY
)

# ---- Install binary ----
install(TARGETS ${BINARY_NAME} RUNTIME DESTINATION bin)

# ---- Install desktop entry ----
install(FILES ${CMAKE_CURRENT_BINARY_DIR}/${BINARY_NAME}.desktop
  DESTINATION share/applications
)

# ---- Install icons ----
foreach(size IN ITEMS 16 32 48 64 128 256)
  install(FILES ${CMAKE_SOURCE_DIR}/icons/${size}x${size}/${BINARY_NAME}.png
    DESTINATION share/icons/hicolor/${size}x${size}/apps
  )
endforeach()
install(FILES ${CMAKE_SOURCE_DIR}/icons/scalable/${BINARY_NAME}.svg
  DESTINATION share/icons/hicolor/scalable/apps
)

# ---- Update desktop + icon caches ----
install(CODE "
  execute_process(COMMAND update-desktop-database -q
    WORKING_DIRECTORY \$ENV{DESTDIR}\${CMAKE_INSTALL_PREFIX}/share/applications)
  execute_process(COMMAND gtk-update-icon-cache -q -t -f
    \$ENV{DESTDIR}\${CMAKE_INSTALL_PREFIX}/share/icons/hicolor)
")

# ---- Uninstall target ----
configure_file(
  ${CMAKE_SOURCE_DIR}/cmake/cmake_uninstall.cmake.in
  ${CMAKE_CURRENT_BINARY_DIR}/cmake_uninstall.cmake
  @ONLY
)
add_custom_target(uninstall
  COMMAND ${CMAKE_COMMAND} -P ${CMAKE_CURRENT_BINARY_DIR}/cmake_uninstall.cmake
)

# ---- Validate .desktop file ----
find_program(DESKTOP_FILE_VALIDATE desktop-file-validate)
if(DESKTOP_FILE_VALIDATE)
  add_custom_command(
    TARGET ${BINARY_NAME}
    POST_BUILD
    COMMAND ${DESKTOP_FILE_VALIDATE}
            ${CMAKE_CURRENT_BINARY_DIR}/${BINARY_NAME}.desktop
    COMMENT "Validating .desktop file"
  )
endif()
