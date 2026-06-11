const payload = {
  workerId: "wk_1841_mq8385xq",
  bedId: "bed_1106_mq8385xq",
  operator: "测试员",
  reason: "性别校验测试",
};

const toRoomId = "room_962_mq8385xp";
const roomGender = "male";
const workerGender = "female";

console.log(`工人(女) 赵芳 尝试入住 男宿舍1-101的床位...`);
fetch("http://localhost:3001/api/dormitory/checkin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
  .then(async (res) => {
    const data = await res.json();
    console.log(`HTTP ${res.status}: ${JSON.stringify(data, null, 2)}`);
  })
  .catch((e) => console.error("错误:", e.message));
