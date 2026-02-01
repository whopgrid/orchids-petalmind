import re

with open('src/app/chat/page.tsx', 'r') as f:
    content = f.read()

stack = []
for match in re.finditer(r'<(/?div)', content):
    tag = match.group(1)
    line = content.count('\n', 0, match.start()) + 1
    if tag == 'div':
        stack.append(line)
    else:
        if stack:
            popped = stack.pop()
            print(f"Closed div at line {line} (opened at {popped})")
        else:
            print(f"Unmatched closing div at line {line}")

for line in stack:
    print(f"Unclosed div opened at line {line}")
