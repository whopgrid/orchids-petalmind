import re

with open('src/app/chat/page.tsx', 'r') as f:
    content = f.read()

def check_tag(tag_name):
    stack = []
    # Match <tag... or </tag
    pattern = rf'<(/?{tag_name})(\s|>|$)'
    for match in re.finditer(pattern, content):
        tag = match.group(1)
        line = content.count('\n', 0, match.start()) + 1
        if not tag.startswith('/'):
            # Check for self-closing
            if not match.group(0).endswith('/>') and not re.search(r'/>', content[match.start():match.end()+20]):
                # This is a bit naive for self-closing but let's try
                # Actually, in JSX most components are explicitly closed or self-closed with />
                # Let's just look for /> in the same tag
                tag_content = content[match.start():content.find('>', match.start())+1]
                if not tag_content.endswith('/>'):
                    stack.append((tag, line))
        else:
            if stack:
                stack.pop()
            else:
                print(f"Unmatched closing {tag_name} at line {line}")
    
    for tag, line in stack:
        print(f"Unclosed {tag_name} opened at line {line}")

check_tag('div')
check_tag('AnimatePresence')
check_tag('motion.div')
check_tag('section')
check_tag('button')
