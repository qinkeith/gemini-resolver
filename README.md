# AI Merge Conflict Resolver with Gemini

This is a Visual Studio Code extension  that uses Google's Generative AI (Gemini Pro model) to automatically resolve Git merge conflicts in code files.

## Key Features

- Automated Conflict Resolution: Uses AI to resolve Git merge conflicts in the active text editor
- Status Bar Integration: Shows a status bar item when conflicts are detected in the current file
- API Key Management: Securely stores the Google AI API key in VS Code's configuration

## Technical Implementation

- VS Code Integration: Registers a command that can be triggered from the status bar or command palette
- Conflict Detection: Uses regex to find standard Git merge conflict markers
- AI Utilization: Leverages Google's Gemini Pro model to analyze and resolve conflicts intelligently
- Diff3 Algorithm: Uses the diff3 package to help find common ancestors of conflicting code sections