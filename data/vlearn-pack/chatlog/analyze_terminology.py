import pandas as pd
import sys
import random
sys.stdout.reconfigure(encoding='utf-8')

file_path = 'd:/Project/20K - AI/Day05/Hackathon/K4-hackathon-T109-E403/data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv'
df = pd.read_csv(file_path)

student_msgs = df[df['role'] == 'student']
print(f"Total student messages: {len(student_msgs)}")

keywords = ['giải thích', 'nghĩa là gì', 'là gì', 'khái niệm', 'thuật ngữ', 'không hiểu', 'ý nghĩa']
# We want to find messages that contain these keywords or are short phrases (which might be just highlighting a term to ask)
# Let's use regex with the keywords
pattern = '|'.join(keywords)

term_msgs = student_msgs[student_msgs['content'].str.contains(pattern, case=False, na=False)]

print(f"\nNumber of messages asking for explanations/definitions: {len(term_msgs)}")
print(f"Percentage: {len(term_msgs) / len(student_msgs) * 100:.2f}%\n")

print("--- Sample Evidence (10 random messages) ---")
# Set seed for reproducibility or just random
sample_msgs = term_msgs.sample(min(10, len(term_msgs)), random_state=42)
for idx, row in sample_msgs.iterrows():
    content = str(row['content']).replace('\n', ' ')
    print(f"- {content}")

# Another way users ask for term explanation is just selecting a short word/phrase and asking nothing.
# In Vlearn, they select text and it appears in parenthesis, e.g. "(Trang X, đoạn được chọn: 'RAG')\nRAG"
# Let's see how many messages are very short (e.g. under 5 words) after removing the "(Trang X...)" prefix.
import re
def get_actual_query(text):
    text = str(text)
    # Remove the "(Trang X, đoạn được chọn: '...')" part
    text = re.sub(r'\(Trang \d+, đoạn được chọn: ".*?"\)\n', '', text)
    return text.strip()

student_msgs = student_msgs.copy()
student_msgs['actual_query'] = student_msgs['content'].apply(get_actual_query)
student_msgs['word_count'] = student_msgs['actual_query'].apply(lambda x: len(x.split()))

short_msgs = student_msgs[(student_msgs['word_count'] <= 5) & (~student_msgs['content'].str.contains(pattern, case=False, na=False))]
print(f"\nNumber of very short queries (<= 5 words, likely just selecting a term): {len(short_msgs)}")
print("--- Sample Short Queries ---")
for idx, row in short_msgs.sample(min(10, len(short_msgs)), random_state=42).iterrows():
    print(f"- {row['actual_query']}")
