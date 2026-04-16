FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    gcc \
    g++ \
    git \
    libssl-dev \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Clone and compile liboqs from source
RUN git clone --depth 1 https://github.com/open-quantum-safe/liboqs.git && \
    cmake -S liboqs -B liboqs/build -DBUILD_SHARED_LIBS=ON && \
    cmake --build liboqs/build --parallel 4 && \
    cmake --install liboqs/build && \
    ldconfig && \
    rm -rf liboqs

# Clone and install liboqs-python
RUN git clone --depth 1 https://github.com/open-quantum-safe/liboqs-python.git && \
    cd liboqs-python && \
    pip3 install . && \
    cd .. && \
    rm -rf liboqs-python

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Set working directory and copy app
WORKDIR /app
COPY app/ .

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
