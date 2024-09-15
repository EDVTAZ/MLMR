CXX      := em++ 
CXXFLAGS := -std=c++17 -Wall -Wextra -O3 -msimd128 -sUSE_ZLIB=1 -pthread -fwasm-exceptions

# USE_PTHREADS + ALLOW_MEMORY_GROWTH may run non-wasm code slowly, see https://github.com/WebAssembly/design/issues/1271

LDFLAGS  := --bind -lembind -lidbfs.js -sTOTAL_MEMORY=1024MB -flto -s"ENVIRONMENT=web,worker" -pthread -sPTHREAD_POOL_SIZE=16 --pre-js src/pre.js
LDFLAGS += -L./libs/ ./libs/opencv/libopencv_calib3d.a ./libs/opencv/libopencv_core.a ./libs/opencv/libopencv_dnn.a ./libs/opencv/libopencv_features2d.a ./libs/opencv/libopencv_flann.a ./libs/opencv/libopencv_imgproc.a ./libs/opencv/libopencv_imgcodecs.a ./libs/opencv/libopencv_objdetect.a ./libs/opencv/libopencv_photo.a ./libs/opencv/libopencv_video.a ./libs/3rdparty/liblibjpeg-turbo.a ./libs/3rdparty/liblibopenjp2.a ./libs/3rdparty/liblibpng.a ./libs/3rdparty/liblibprotobuf.a ./libs/3rdparty/liblibwebp.a ./libs/3rdparty/libzlib.a
BUILD    := ./build
OBJ_DIR  := $(BUILD)/objects
APP_DIR  := $(BUILD)/wasm
TARGET   := aligner.js
INCLUDE  := -I./include/
SRC      := src/main.cpp

OBJECTS  := $(SRC:%.cpp=$(OBJ_DIR)/%.o)
DEPENDENCIES := $(OBJECTS:.o=.d)

all: build $(APP_DIR)/$(TARGET)

$(OBJ_DIR)/%.o: %.cpp
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) $(INCLUDE) -c $< -MMD -o $@

$(APP_DIR)/$(TARGET): $(OBJECTS)
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) -o $(APP_DIR)/$(TARGET) $^ $(LDFLAGS)

-include $(DEPENDENCIES)

.PHONY: all build clean debug release info

build:
	@mkdir -p $(APP_DIR)
	@mkdir -p $(OBJ_DIR)

debug: CXXFLAGS += -DDEBUG -g
debug: all

release: all

clean:
	-@rm -rvf $(OBJ_DIR)/*
	-@rm -rvf $(APP_DIR)/*