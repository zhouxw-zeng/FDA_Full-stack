<script setup lang="ts">
import { computed, ref } from 'vue';

type TabKey = 'feed' | 'ai' | 'chat' | 'friends';

type Moment = {
  id: string;
  title: string;
  author: string;
  avatar: string;
  time: string;
  topic: string;
  image: string;
  likes: number;
  comments: number;
  height: 'tall' | 'short';
  liked?: boolean;
};

const base = import.meta.env.BASE_URL;
const asset = (path: string) => `${base}${path}`;

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'feed', label: '动态', icon: 'icons/home.png' },
  { key: 'ai', label: 'AI', icon: 'icons/ai.png' },
  { key: 'chat', label: '聊天', icon: 'icons/msg.png' },
  { key: 'friends', label: '好友', icon: 'icons/friend.png' },
];

const moments = ref<Moment[]>([
  {
    id: 'breakfast',
    title: '周末的早餐桌，终于把大家的时间凑到了一起。',
    author: '林间日常',
    avatar: '林',
    time: '09:24',
    topic: '周末早餐',
    image: asset('images/moment-breakfast.jpg'),
    likes: 28,
    comments: 6,
    height: 'tall',
  },
  {
    id: 'garden',
    title: '窗台的花盆换好了新土，今天的家务也有了一点奖励。',
    author: '林间日常',
    avatar: '林',
    time: '昨天',
    topic: '阳台植物',
    image: asset('images/moment-garden.jpg'),
    likes: 19,
    comments: 4,
    height: 'short',
  },
  {
    id: 'walk',
    title: '傍晚绕公园走了一圈，路边的小花被认真地记录下来了。',
    author: '小满',
    avatar: '满',
    time: '昨天',
    topic: '傍晚散步',
    image: asset('images/moment-walk.jpg'),
    likes: 34,
    comments: 8,
    height: 'tall',
  },
  {
    id: 'dinner',
    title: '第一次一起整理厨房，忙了很久，但过程值得收藏。',
    author: '阿远',
    avatar: '远',
    time: '周一',
    topic: '一起做饭',
    image: asset('images/moment-dinner.jpg'),
    likes: 21,
    comments: 3,
    height: 'short',
  },
]);

const activeTab = ref<TabKey>('feed');
const searchQuery = ref('');
const toast = ref('');
const aiPrompt = ref('');
const aiMessages = ref([
  {
    role: 'assistant',
    text: '可以帮你把今天的家庭照片整理成一段发布文案。先告诉我照片里发生了什么。',
  },
]);

const filteredMoments = computed(() => {
  const keyword = searchQuery.value.trim();
  if (!keyword) return moments.value;
  return moments.value.filter((moment) =>
    `${moment.title} ${moment.topic} ${moment.author}`.includes(keyword),
  );
});

const unreadCount = computed(() => moments.value.filter((moment) => moment.liked).length);

function toggleLike(moment: Moment) {
  moment.liked = !moment.liked;
  moment.likes += moment.liked ? 1 : -1;
  toast.value = moment.liked ? '已经送上回应' : '已取消回应';
  window.setTimeout(() => {
    toast.value = '';
  }, 1400);
}

function showToast(message: string) {
  toast.value = message;
  window.setTimeout(() => {
    toast.value = '';
  }, 1400);
}

function submitAiPrompt() {
  const prompt = aiPrompt.value.trim();
  if (!prompt) return;

  aiMessages.value.push({ role: 'user', text: prompt });
  aiMessages.value.push({
    role: 'assistant',
    text: '可以这样写：把一家人的周末留在同一张照片里，早餐不算丰盛，但每个人都在场。',
  });
  aiPrompt.value = '';
}
</script>

<template>
  <main class="preview-stage">
    <aside class="preview-intro">
      <p class="preview-label">Vue 3 + Vite 4</p>
      <h1>一个真正可以点开的家庭社区。</h1>
      <p class="preview-copy">
        搜索动态、切换 AI、给家人送出回应。演示数据只用于展示真实交互，不会提交到后端。
      </p>
      <ul class="preview-features">
        <li>双列家庭动态流</li>
        <li>AI 文案辅助</li>
        <li>私信与好友关系</li>
      </ul>
      <div class="preview-status">
        <span>界面状态</span>
        <strong>{{ activeTab === 'feed' ? '正在浏览动态' : '已切换功能标签' }}</strong>
      </div>
    </aside>

    <section class="app-window" aria-label="家庭动态小助手交互演示">
      <header class="app-topbar">
        <div class="app-profile">
          <span class="app-avatar">林</span>
          <div>
            <strong>林间日常</strong>
            <small>家庭空间</small>
          </div>
        </div>
        <span class="app-time">今天 09:24</span>
      </header>

      <div class="app-main">
        <div v-if="activeTab === 'feed'" class="feed-view">
          <div class="feed-title-row">
            <div>
              <span class="feed-kicker">Moments</span>
              <h2>家庭动态</h2>
            </div>
            <label class="feed-search">
              <span class="sr-only">搜索动态</span>
              <input v-model="searchQuery" type="search" placeholder="搜索记录" />
            </label>
          </div>

          <div v-if="filteredMoments.length" class="moment-grid">
            <article
              v-for="moment in filteredMoments"
              :key="moment.id"
              class="moment-card"
              :class="`moment-card--${moment.height}`"
            >
              <div class="moment-image">
                <img :src="moment.image" :alt="moment.topic" />
              </div>
              <h3>{{ moment.title }}</h3>
              <div class="moment-meta">
                <span class="mini-avatar">{{ moment.avatar }}</span>
                <span>{{ moment.author }}</span>
                <span>{{ moment.time }}</span>
              </div>
              <div class="moment-actions">
                <button
                  type="button"
                  :class="{ active: moment.liked }"
                  :aria-label="moment.liked ? '取消回应' : '送出回应'"
                  @click="toggleLike(moment)"
                >
                  {{ moment.liked ? '已回应' : '回应' }} {{ moment.likes }}
                </button>
                <button type="button" @click="showToast('评论入口已打开')">
                  评论 {{ moment.comments }}
                </button>
              </div>
            </article>
          </div>

          <div v-else class="empty-state">
            <h3>没有找到这条记录</h3>
            <p>换一个更短的关键词，或者清空搜索。</p>
            <button type="button" @click="searchQuery = ''">清空搜索</button>
          </div>
        </div>

        <div v-else-if="activeTab === 'ai'" class="ai-view">
          <div class="panel-title">
            <span>AI 文案助手</span>
            <strong>带上下文的创作建议</strong>
          </div>
          <div class="ai-thread">
            <div
              v-for="(message, index) in aiMessages"
              :key="`${message.role}-${index}`"
              class="ai-message"
              :class="`ai-message--${message.role}`"
            >
              {{ message.text }}
            </div>
          </div>
          <div class="ai-suggestions">
            <button type="button" @click="aiPrompt = '写得更像日常记录一点'">
              更像日常记录
            </button>
            <button type="button" @click="aiPrompt = '写一段周末早餐的文案'">
              周末早餐文案
            </button>
          </div>
          <form class="ai-input" @submit.prevent="submitAiPrompt">
            <input v-model="aiPrompt" placeholder="告诉我照片里发生了什么" />
            <button type="submit">生成</button>
          </form>
        </div>

        <div v-else-if="activeTab === 'chat'" class="chat-view">
          <div class="panel-title">
            <span>家庭私信</span>
            <strong>最近联系</strong>
          </div>
          <div class="chat-list">
            <article>
              <span class="chat-avatar">满</span>
              <div>
                <strong>小满</strong>
                <p>公园那几张照片我整理好了。</p>
              </div>
              <small>10:32</small>
            </article>
            <article>
              <span class="chat-avatar chat-avatar--green">远</span>
              <div>
                <strong>阿远</strong>
                <p>晚饭想吃什么？我提前准备。</p>
              </div>
              <small>昨天</small>
            </article>
            <article>
              <span class="chat-avatar chat-avatar--gold">妈</span>
              <div>
                <strong>家里群聊</strong>
                <p>周末回家记得带相机。</p>
              </div>
              <small>周一</small>
            </article>
          </div>
        </div>

        <div v-else class="friends-view">
          <div class="panel-title">
            <span>好友与关注</span>
            <strong>最近活跃</strong>
          </div>
          <div class="friend-grid">
            <article>
              <span class="friend-avatar">满</span>
              <h3>小满</h3>
              <p>关注 18 · 粉丝 36</p>
              <button type="button" @click="showToast('已打开小满的主页')">查看主页</button>
            </article>
            <article>
              <span class="friend-avatar friend-avatar--green">远</span>
              <h3>阿远</h3>
              <p>关注 11 · 粉丝 22</p>
              <button type="button" @click="showToast('已发送问候')">打个招呼</button>
            </article>
            <article>
              <span class="friend-avatar friend-avatar--gold">妈</span>
              <h3>林妈妈</h3>
              <p>关注 9 · 粉丝 14</p>
              <button type="button" @click="showToast('已打开家庭群聊')">家庭群聊</button>
            </article>
          </div>
        </div>
      </div>

      <nav class="app-tabs" aria-label="产品演示主导航">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <span class="tab-icon">
            <img :src="asset(tab.icon)" alt="" />
          </span>
          <span>{{ tab.label }}</span>
          <i v-if="tab.key === 'chat' && unreadCount > 0">{{ unreadCount }}</i>
        </button>
      </nav>

      <div v-if="toast" class="demo-toast" aria-live="polite">{{ toast }}</div>
    </section>
  </main>
</template>
