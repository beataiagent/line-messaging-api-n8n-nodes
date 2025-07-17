# n8n-nodes-linewebhook

นี่คือ community node สำหรับ [n8n](https://n8n.io/) ที่ช่วยให้คุณเชื่อมต่อกับ **LINE Messaging API** ได้อย่างง่ายดาย สามารถใช้สร้าง LINE Chatbot ผ่าน n8n โดยไม่จำเป็นต้องเขียนโค้ด

&#x20;

---

**Document เวอร์ชันต่าง ๆ**

* [English (เอกสารนี้)](#)
* [ภาษาไทย (Thai Version)](./documentation/README.th.md)

---

## สารบัญ

* [การติดตั้ง](#การติดตั้ง)
* [Node และการทำงาน](#node-และการทำงาน)
* [การตั้งค่า Credentials](#การตั้งค่า-credentials)
* [ตัวอย่าง Workflow](#ตัวอย่าง-workflow)
* [การใช้งานในเครื่อง (Local)](#การใช้งานในเครื่อง-local)

---

## การติดตั้ง

### Community Nodes (แนะนำ)

1. ไปที่ **Settings > Community Nodes**
2. เลือก **Install**
3. กรอกชื่อแพ็กเกจ `n8n-nodes-line-messaging-api`
<pre> n8n-nodes-line-messaging-api</pre>
4. ติ๊กยอมรับความเสี่ยงในการติดตั้ง community node
5. กด **Install**

<img src="./images/installation-1.png" alt="Setup Package" width="500px;" />
<img src="./images/installation-2.png" alt="Setup Package" width="500px;" />

เมื่อติดตั้งเสร็จ Node นี้จะปรากฏใน panel และสามารถใช้งานได้เหมือน Node อื่น ๆ

---

### การติดตั้งแบบ Manual

ติดตั้งแพ็กเกจใน root directory ของ n8n:

```bash
npm install n8n-nodes-linewebhook
```

ถ้าใช้ Docker ให้เพิ่มบรรทัดนี้ใน Dockerfile ก่อนคำสั่งติดตั้งฟอนต์:

```dockerfile
RUN npm install n8n-nodes-linewebhook
```

---

## Node และการทำงาน

แพ็กเกจนี้มี Node หลัก 2 ตัว:

### 1. Line Webhook (Trigger Node)

ใช้เป็น trigger เพื่อเริ่ม workflow เมื่อได้รับ Event จาก LINE Platform

**Event ที่รองรับ:**

* `message` (เช่น `text`, `image`, `video`, `audio`, `location`, `sticker`)
* `postback`
* `join` / `leave`
* `memberJoined` / `memberLeft`

### 2. Line (Regular Node)

ใช้สำหรับส่งคำสั่งหรือข้อความผ่าน LINE Messaging API

#### Operation: Send Message

ส่งข้อความ โดยสามารถใส่ `replyToken` เพื่อโต้ตอบ Event หรือระบุ `targetRecipient` (เช่น User ID หรือ Group ID) เพื่อ Push ข้อความ

รองรับข้อความประเภท:

* ข้อความ (Text)
* รูปภาพ
* วิดีโอ
* เสียง
* ตำแหน่ง
* สติกเกอร์
* Flex Message (ผ่าน JSON editor)

#### Operation: Get Message Content

ใช้ดึงเนื้อหาจริง (ภาพ เสียง ฯลฯ) จาก message ที่มี `messageId` เช่นเวลาผู้ใช้ส่งภาพมา

#### Operation: Get User Profile

ใช้ดึงข้อมูลโปรไฟล์ของผู้ใช้ เช่น display name, รูปโปรไฟล์, status message

#### Operation: Get Group Chat Summary

ใช้ดึงข้อมูลของกลุ่ม เช่นชื่อกลุ่มและรูปภาพจาก Group ID

---

## การตั้งค่า Credentials

คุณจำเป็นต้องตั้งค่า credentials จาก LINE Developer Console สำหรับช่องทาง Messaging API ของคุณ

### Webhook Credentials

ใช้ใน Line Webhook Trigger เพื่อยืนยันว่า Event ที่เข้ามาถูกส่งจาก LINE จริง

1. เข้า LINE Developer Console แล้วไปที่ **Messaging API** ของ channel ของคุณ
2. คัดลอก **Channel secret**
3. ใน n8n ให้สร้าง credential ใหม่และวาง Channel Secret ลงไป
4. คัดลอก webhook URL จาก node ไปใส่ในช่อง **Webhook URL** ของ LINE Channel

### Messaging API Credentials

ใช้ใน Node Line เพื่อส่งข้อความหรือเรียก API ของ LINE

1. เข้า LINE Developer Console แล้วไปที่ **Messaging API**
2. คัดลอก **Channel Access Token** (หากยังไม่มีต้องกด issue ใหม่)
3. ใน n8n สร้าง credential ใหม่และวาง access token ลงไป

---

## ตัวอย่าง Workflow

เคสที่พบบ่อย: รับข้อความจากผู้ใช้แล้วส่งตอบกลับทันที

1. เพิ่ม **Line Webhook** node และตั้งค่า credentials + webhook URL
2. เพิ่ม **Line** node
3. เชื่อม output ของ trigger ไปที่ input ของ Line node
4. ตั้ง operation เป็น **Send Message**
5. ในช่อง `Reply Token` ให้ใช้ expression:
   `{{ $json.events[0].replyToken }}`
6. ใส่ข้อความที่ต้องการส่งกลับในช่อง `Messages`

---

## การใช้งานในเครื่อง (Local)

หากคุณรัน n8n บนเครื่องของคุณ เช่นที่ `http://localhost:5678` — URL นี้จะไม่สามารถเข้าถึงจาก LINE ได้โดยตรง

คุณต้องใช้เครื่องมือ tunneling เพื่อ expose n8n สู่ public:

**ตัวเลือกยอดนิยม:**



---
