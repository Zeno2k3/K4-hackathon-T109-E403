import pandas as pd
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

file_path = 'd:/Project/20K - AI/Day05/Hackathon/K4-hackathon-T109-E403/data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv'
df = pd.read_csv(file_path)

print(f"Total rows: {len(df)}")
tutor_msgs = df[df['role'] == 'tutor']
student_msgs = df[df['role'] == 'student']

print("\n--- 1. Rating (Đánh giá) ---")
print(df['rating'].value_counts(dropna=False))

print("\n--- 2. Latency (Độ trễ) ---")
print(df['avg_latency_ms'].describe())
print(f"99th percentile latency: {df['avg_latency_ms'].quantile(0.99)}")
print(f"High latency (>10s): {len(df[df['avg_latency_ms'] > 10000])} rows")
print(f"High latency (>20s): {len(df[df['avg_latency_ms'] > 20000])} rows")

print("\n--- 3. Tutor responses indicating failure to help ---")
keywords = ['không tìm thấy', 'rất tiếc', 'xin lỗi', 'ngoài phạm vi', 'không có khả năng', 'chưa hiểu rõ']
for kw in keywords:
    count = tutor_msgs['content'].str.contains(kw, case=False, na=False).sum()
    print(f"'{kw}': {count}")

print("\n--- 4. LLM Call Count ---")
print(df['llm_call_count'].describe())
print(f"High call count (>5): {len(df[df['llm_call_count'] > 5])} rows")

print("\n--- 5. Citations ---")
print(f"Empty citations '[]': {tutor_msgs['citations'].apply(lambda x: str(x) == '[]').sum()}")
print(f"Null citations: {tutor_msgs['citations'].isna().sum()}")

print("\n--- 6. Move Used ---")
print(tutor_msgs['move_used'].value_counts())

print("\n--- 7. Asked Check Question ---")
print(tutor_msgs['asked_check_question'].value_counts(dropna=False))
