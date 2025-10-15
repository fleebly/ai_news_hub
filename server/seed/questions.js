const Question = require('../models/Question');

const sampleQuestions = [
  {
    title: "两数之和",
    description: "给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。\n\n你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。\n\n你可以按任意顺序返回答案。",
    difficulty: "beginner",
    category: "algorithm",
    language: "javascript",
    starterCode: `function twoSum(nums, target) {
    // 你的代码
}`,
    testCases: [
      {
        input: { nums: [2, 7, 11, 15], target: 9 },
        expectedOutput: [0, 1],
        description: "nums[0] + nums[1] = 2 + 7 = 9"
      },
      {
        input: { nums: [3, 2, 4], target: 6 },
        expectedOutput: [1, 2],
        description: "nums[1] + nums[2] = 2 + 4 = 6"
      }
    ],
    hints: [
      "可以使用哈希表来存储已经遍历过的数字和它们的索引",
      "对于每个数字，检查 target - 当前数字 是否在哈希表中"
    ],
    solution: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
    explanation: "使用哈希表存储每个数字的索引。对于每个数字，我们检查目标值减去当前数字的结果是否已经在哈希表中。如果存在，说明找到了答案。",
    tags: ["数组", "哈希表"],
    timeLimit: 15,
    points: 10
  },
  {
    title: "反转链表",
    description: "给你单链表的头节点 head，请你反转链表，并返回反转后的链表。",
    difficulty: "intermediate",
    category: "data-structure",
    language: "javascript",
    starterCode: `function reverseList(head) {
    // 你的代码
}`,
    testCases: [
      {
        input: { head: [1, 2, 3, 4, 5] },
        expectedOutput: [5, 4, 3, 2, 1],
        description: "反转链表"
      }
    ],
    hints: [
      "可以使用迭代或递归的方法",
      "迭代方法需要三个指针：prev, current, next",
      "递归方法需要先递归到最后一个节点，然后逐步反转"
    ],
    solution: `function reverseList(head) {
    let prev = null;
    let current = head;
    
    while (current !== null) {
        const next = current.next;
        current.next = prev;
        prev = current;
        current = next;
    }
    
    return prev;
}`,
    explanation: "使用迭代方法，维护三个指针：prev（前一个节点）、current（当前节点）、next（下一个节点）。在每次迭代中，将当前节点的next指向前一个节点，然后移动指针。",
    tags: ["链表", "递归", "迭代"],
    timeLimit: 20,
    points: 20
  },
  {
    title: "最长公共子序列",
    description: "给定两个字符串 text1 和 text2，返回这两个字符串的最长公共子序列的长度。如果不存在公共子序列，返回 0。\n\n一个字符串的子序列是指这样一个新的字符串：它是由原字符串在不改变字符的相对顺序的情况下删除某些字符（也可以不删除任何字符）后组成的新字符串。",
    difficulty: "advanced",
    category: "algorithm",
    language: "javascript",
    starterCode: `function longestCommonSubsequence(text1, text2) {
    // 你的代码
}`,
    testCases: [
      {
        input: { text1: "abcde", text2: "ace" },
        expectedOutput: 3,
        description: "最长公共子序列是 'ace'，长度为 3"
      },
      {
        input: { text1: "abc", text2: "def" },
        expectedOutput: 0,
        description: "没有公共子序列"
      }
    ],
    hints: [
      "这是一个经典的动态规划问题",
      "定义 dp[i][j] 表示 text1[0...i-1] 和 text2[0...j-1] 的最长公共子序列长度",
      "状态转移方程：如果 text1[i-1] === text2[j-1]，则 dp[i][j] = dp[i-1][j-1] + 1；否则 dp[i][j] = max(dp[i-1][j], dp[i][j-1])"
    ],
    solution: `function longestCommonSubsequence(text1, text2) {
    const m = text1.length;
    const n = text2.length;
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i - 1] === text2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    return dp[m][n];
}`,
    explanation: "使用动态规划解决。dp[i][j] 表示 text1 前 i 个字符和 text2 前 j 个字符的最长公共子序列长度。如果两个字符相等，则长度加1；否则取两个方向的最大值。",
    tags: ["动态规划", "字符串"],
    timeLimit: 30,
    points: 30
  },
  {
    title: "实现栈",
    description: "请你仅使用两个队列实现一个后入先出（LIFO）的栈，并支持普通栈的全部四种操作（push、top、pop 和 empty）。\n\n实现 MyStack 类：\n- void push(int x) 将元素 x 压入栈顶。\n- int pop() 移除并返回栈顶元素。\n- int top() 返回栈顶元素。\n- boolean empty() 如果栈是空的，返回 true；否则，返回 false。",
    difficulty: "intermediate",
    category: "data-structure",
    language: "javascript",
    starterCode: `class MyStack {
    constructor() {
        // 你的代码
    }
    
    push(x) {
        // 你的代码
    }
    
    pop() {
        // 你的代码
    }
    
    top() {
        // 你的代码
    }
    
    empty() {
        // 你的代码
    }
}`,
    testCases: [
      {
        input: { operations: ["push", "push", "top", "pop", "empty"], values: [1, 2, null, null, null] },
        expectedOutput: [null, null, 2, 2, false],
        description: "基本栈操作"
      }
    ],
    hints: [
      "使用两个队列，一个作为主队列，一个作为辅助队列",
      "push 操作时，将新元素加入主队列",
      "pop 操作时，将主队列中除最后一个元素外的所有元素移到辅助队列，然后移除最后一个元素"
    ],
    solution: `class MyStack {
    constructor() {
        this.queue1 = [];
        this.queue2 = [];
    }
    
    push(x) {
        this.queue1.push(x);
    }
    
    pop() {
        while (this.queue1.length > 1) {
            this.queue2.push(this.queue1.shift());
        }
        const result = this.queue1.shift();
        [this.queue1, this.queue2] = [this.queue2, this.queue1];
        return result;
    }
    
    top() {
        while (this.queue1.length > 1) {
            this.queue2.push(this.queue1.shift());
        }
        const result = this.queue1[0];
        this.queue2.push(this.queue1.shift());
        [this.queue1, this.queue2] = [this.queue2, this.queue1];
        return result;
    }
    
    empty() {
        return this.queue1.length === 0;
    }
}`,
    explanation: "使用两个队列实现栈。push 操作直接加入主队列。pop 和 top 操作时，将主队列中除最后一个元素外的所有元素移到辅助队列，然后处理最后一个元素。",
    tags: ["栈", "队列", "设计"],
    timeLimit: 25,
    points: 25
  },
  {
    title: "合并两个有序数组",
    description: "给你两个按非递减顺序排列的整数数组 nums1 和 nums2，另有两个整数 m 和 n，分别表示 nums1 和 nums2 中的元素数目。\n\n请你合并 nums2 到 nums1 中，使合并后的数组同样按非递减顺序排列。\n\n注意：最终，合并后数组不应由函数返回，而是存储在数组 nums1 中。为了应对这种情况，nums1 的初始长度为 m + n，其中前 m 个元素表示应合并的元素，后 n 个元素为 0，应忽略。nums2 的长度为 n。",
    difficulty: "beginner",
    category: "algorithm",
    language: "javascript",
    starterCode: `function merge(nums1, m, nums2, n) {
    // 你的代码
}`,
    testCases: [
      {
        input: { nums1: [1, 2, 3, 0, 0, 0], m: 3, nums2: [2, 5, 6], n: 3 },
        expectedOutput: [1, 2, 2, 3, 5, 6],
        description: "合并两个有序数组"
      }
    ],
    hints: [
      "从后往前合并，避免覆盖 nums1 中的元素",
      "使用三个指针：i 指向 nums1 的有效元素末尾，j 指向 nums2 的末尾，k 指向 nums1 的末尾",
      "比较 nums1[i] 和 nums2[j]，将较大的元素放到 nums1[k]"
    ],
    solution: `function merge(nums1, m, nums2, n) {
    let i = m - 1;
    let j = n - 1;
    let k = m + n - 1;
    
    while (i >= 0 && j >= 0) {
        if (nums1[i] > nums2[j]) {
            nums1[k] = nums1[i];
            i--;
        } else {
            nums1[k] = nums2[j];
            j--;
        }
        k--;
    }
    
    while (j >= 0) {
        nums1[k] = nums2[j];
        j--;
        k--;
    }
}`,
    explanation: "从后往前合并两个有序数组。使用三个指针分别指向两个数组的末尾和合并后数组的末尾。比较两个数组的元素，将较大的元素放到合并后数组的末尾。",
    tags: ["数组", "双指针"],
    timeLimit: 15,
    points: 15
  }
];

const seedQuestions = async () => {
  try {
    await Question.deleteMany({});
    await Question.insertMany(sampleQuestions);
    console.log('✅ 题目数据已成功导入');
  } catch (error) {
    console.error('❌ 导入题目数据失败:', error);
  }
};

module.exports = seedQuestions;

