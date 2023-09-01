<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import avatar from '@/assets/login/avatar.svg';
import bg from '@/assets/login/bg.png';
import illustration from '@/assets/login/illustration.svg';
import EpLock from '~icons/ep/lock';
import EpUserFilled from '~icons/ep/user-filled';

const ruleFormRef = ref<FormInstance>();
const loading = ref(false);
const ruleForm = reactive({
  username: '',
  password: '',
  verifyCode: '',
});
const REGEXP_PWD =
  /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)]|[()])+$)(?!^.*[\u4E00-\u9FA5].*$)([^(0-9a-zA-Z)]|[()]|[a-z]|[A-Z]|[0-9]){8,18}$/;

const loginRules = reactive<FormRules>({
  password: [
    {
      validator: (_rule, value, callback) => {
        if (value === '') {
          callback(new Error('请输入密码'));
        } else if (!REGEXP_PWD.test(value)) {
          callback(
            new Error('密码格式应为8-18位数字、字母、符号的任意两种组合'),
          );
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  verifyCode: [
    {
      validator: (_rule, value, callback) => {
        if (value === '') {
          callback(new Error('请输入验证码'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
});
const router = useRouter();
const onLogin = async (formEl: FormInstance | undefined) => {
  loading.value = true;
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      login({
        username: ruleForm.username,
        password: ruleForm.password,
      }).then(({ status, msg, token }) => {
        if (status === 200) {
          sessionStorage.setItem('token', token as string);
          setToken(token as string);
          router.push('/');
          notify.success('登录成功');
        } else {
          notify.warning(`登录失败:${msg}`);
          loading.value = false;
        }
      });
    } else {
      loading.value = false;
      return fields;
    }
  });
};
</script>

<template>
  <div class="select-none">
    <img :src="bg" class="wave" />
    <div class="login-container">
      <div class="img">
        <img :src="illustration" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <img :src="avatar" class="avatar" />
          <el-form
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            size="large"
          >
            <el-form-item
              :rules="[
                {
                  required: true,
                  message: '请输入账号',
                  trigger: 'blur',
                },
              ]"
              prop="username"
            >
              <el-input
                v-model="ruleForm.username"
                clearable
                placeholder="账号"
                :prefix-icon="EpUserFilled"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="ruleForm.password"
                clearable
                show-password
                placeholder="密码"
                :prefix-icon="EpLock"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                class="w-full mt-4"
                size="default"
                type="primary"
                :loading="loading"
                @click="onLogin(ruleFormRef)"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.wave {
  position: fixed;
  height: 100%;
  left: 0;
  bottom: 0;
  z-index: -1;
}

.login-container {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 18rem;
  padding: 0 2rem;
}

.img {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.img img {
  width: 500px;
}

.login-box {
  display: flex;
  align-items: center;
  text-align: center;
}

.login-form {
  width: 360px;
}

.avatar {
  width: 350px;
  height: 80px;
}

.login-form h2 {
  text-transform: uppercase;
  margin: 15px 0;
  color: #999;
  font:
    bold 200% Consolas,
    Monaco,
    monospace;
}

@media screen and (max-width: 1180px) {
  .login-container {
    grid-gap: 9rem;
  }

  .login-form {
    width: 290px;
  }

  .login-form h2 {
    font-size: 2.4rem;
    margin: 8px 0;
  }

  .img img {
    width: 360px;
  }

  .avatar {
    width: 280px;
    height: 80px;
  }
}

@media screen and (max-width: 968px) {
  .wave {
    display: none;
  }

  .img {
    display: none;
  }

  .login-container {
    grid-template-columns: 1fr;
  }

  .login-box {
    justify-content: center;
  }
}
</style>
