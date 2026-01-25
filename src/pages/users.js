
import { qs, qsa } from "../utils.js";
import { getState, addUser, updateUser, deleteUser } from "../store.js";
import { toast } from "../components/toast.js";

let editingId = null;

function render() {
  const root = qs("#users-root");
  const st = getState();

  root.innerHTML = `
    <div class="bg-white border border-gray-200 rounded-2xl p-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold text-gray-800">Danh sách người dùng</div>
          <div class="text-xs text-gray-500 mt-1">CRUD demo (lưu localStorage)</div>
        </div>
        <button id="user-add" class="btn btn-primary">+ Thêm người dùng</button>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Role</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${st.users.map((u) => `
              <tr>
                <td><div class="font-semibold text-gray-800">${u.name}</div></td>
                <td class="text-sm text-gray-700">${u.email}</td>
                <td><span class="chip chip-cont">${u.role}</span></td>
                <td>${u.status === "active" ? '<span class="chip chip-live">ACTIVE</span>' : '<span class="chip chip-offline">LOCKED</span>'}</td>
                <td class="text-right">
                  <button class="btn btn-secondary text-xs" data-edit="${u.id}">Sửa</button>
                  <button class="btn btn-danger text-xs" data-del="${u.id}">Xoá</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="divider my-4"></div>

      <div id="user-form" class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-gray-500 font-semibold">Tên</label>
          <input id="uf-name" class="input mt-1" placeholder="Nhập tên" />
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Email</label>
          <input id="uf-email" class="input mt-1" placeholder="email@domain.com" />
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Role</label>
          <select id="uf-role" class="select mt-1">
            <option>Admin</option>
            <option>Supervisor</option>
            <option>Operator</option>
            <option>Viewer</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 font-semibold">Trạng thái</label>
          <select id="uf-status" class="select mt-1">
            <option value="active">Active</option>
            <option value="locked">Locked</option>
          </select>
        </div>
        <div class="col-span-2 flex items-center gap-2">
          <button id="uf-save" class="btn btn-primary">Lưu</button>
          <button id="uf-cancel" class="btn btn-secondary">Huỷ</button>
          <div class="text-xs text-gray-500 ml-auto" id="uf-hint">Tạo mới người dùng</div>
        </div>
      </div>
    </div>
  `;
  wire();
}

function resetForm() {
  editingId = null;
  qs("#uf-name").value = "";
  qs("#uf-email").value = "";
  qs("#uf-role").value = "Viewer";
  qs("#uf-status").value = "active";
  qs("#uf-hint").textContent = "Tạo mới người dùng";
}

function fillForm(user) {
  editingId = user.id;
  qs("#uf-name").value = user.name;
  qs("#uf-email").value = user.email;
  qs("#uf-role").value = user.role;
  qs("#uf-status").value = user.status;
  qs("#uf-hint").textContent = `Đang sửa: ${user.email}`;
}

function wire() {
  qs("#user-add")?.addEventListener("click", () => {
    resetForm();
    toast({ title: "Người dùng", message: "Nhập thông tin và bấm Lưu", variant: "info" });
  });

  qsa("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      const u = getState().users.find((x) => x.id === id);
      if (u) fillForm(u);
    });
  });

  qsa("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const u = getState().users.find((x) => x.id === id);
      if (!u) return;
      if (!confirm(`Xoá user ${u.email}?`)) return;
      deleteUser(id);
      toast({ title: "Xoá", message: "Đã xoá người dùng", variant: "success" });
      render();
    });
  });

  qs("#uf-save")?.addEventListener("click", () => {
    const name = (qs("#uf-name").value || "").trim();
    const email = (qs("#uf-email").value || "").trim();
    const role = qs("#uf-role").value;
    const status = qs("#uf-status").value;

    if (!name || !email) {
      toast({ title: "Thiếu thông tin", message: "Vui lòng nhập Tên và Email", variant: "danger" });
      return;
    }

    if (editingId) {
      updateUser(editingId, { name, email, role, status });
      toast({ title: "Cập nhật", message: "Đã cập nhật người dùng", variant: "success" });
    } else {
      addUser({ name, email, role, status });
      toast({ title: "Tạo mới", message: "Đã thêm người dùng", variant: "success" });
    }
    render();
    resetForm();
  });

  qs("#uf-cancel")?.addEventListener("click", () => {
    resetForm();
    toast({ title: "Huỷ", message: "Đã huỷ thao tác", variant: "info" });
  });

  resetForm();
}

export function initUsersPage() {
  render();
}
export function refreshUsers() {
  initUsersPage();
}