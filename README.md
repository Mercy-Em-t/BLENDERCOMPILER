# BLENDERCOMPILER

**Text to Blender** — a tool that converts text descriptions into Blender-compatible scripts or 3D scene definitions.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

---

## About

BLENDERCOMPILER is a project designed to bridge natural language (or structured text) and the Blender 3D creation suite. It parses text input and compiles it into Blender Python scripts (`.py`) or other Blender-compatible formats so you can automate and script 3D scene creation without writing Blender API code by hand.

---

## Features

- Convert plain-text scene descriptions into Blender Python scripts
- Support for common 3D objects (meshes, lights, cameras)
- Output scripts that are ready to run inside Blender's scripting editor
- Extensible grammar for adding new object types and modifiers

---

## Getting Started

### Prerequisites

- [Python 3.8+](https://www.python.org/downloads/)
- [Blender 3.0+](https://www.blender.org/download/) (to run the generated scripts)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Mercy-Em-t/BLENDERCOMPILER.git
   cd BLENDERCOMPILER
   ```

2. Install dependencies (if any are listed in `requirements.txt`):

   ```bash
   pip install -r requirements.txt
   ```

---

## Usage

1. Write your scene description in a text file (e.g., `scene.txt`).
2. Run the compiler:

   ```bash
   python blendercompiler.py scene.txt -o scene.py
   ```

3. Open Blender, go to the **Scripting** workspace, load `scene.py`, and press **Run Script**.

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a pull request.

Please ensure your code follows the existing style and includes tests where applicable.

---

## License

This project is licensed under the [MIT License](LICENSE).
