

// /**
//   ******************************************************************************
//   * @file    xsl_game_sudo.c
//   * @author  徐松亮 许红宁(5387603@qq.com)
//   * @version V1.0.0
//   * @date    2018/11/01
//   ******************************************************************************
//   * @attention
//   * 待解决
//   * 1,数独出题
//   * GNU General Public License (GPL)
//   *
//   * <h2><center>&copy; COPYRIGHT 2017 XSLXHN</center></h2>
//   ******************************************************************************
//   */

// /* Includes ------------------------------------------------------------------*/
// #include < stdio.h >
// #include < stdint.h >
// // 用于计算耗时统计
// #include < time.h >
// /* Private define ------------------------------------------------------------*/
// #define XSLGAMESUDO_SUDOKU_LEVEL 9
// #define OK 0
// #define ERR 1
// /* Private typedef -----------------------------------------------------------*/
// typedef struct
// {
//     // 输入---计算前用户设定
//     uint8_t cells[XSLGAMESUDO_SUDOKU_LEVEL][XSLGAMESUDO_SUDOKU_LEVEL];
//     //-----最大输出答案数量(1,为了防止pOutBuf数据溢出;2,为了计算适可而止;)
//     uint32_t MaxOutAnswersCount;
//     // 输入输出
//     //-----输出缓存(NULL---无解输出)
//     uint8_t * pOutBuf;
//     //-----解最大数量(NULL---不求此值则非全局搜索)
//     uint32_t * pAnswersCount;
//     // 输出---计算后的统计结果
//     uint32_t OutAnswersCount;
// } XSLGAMESUDO_S_SUDO;
// /* Private macro -------------------------------------------------------------*/
// /* Private variables ---------------------------------------------------------*/
// static const uint8_t XslGameSudo_SudoGenerateBuf[XSLGAMESUDO_SUDOKU_LEVEL][XSLGAMESUDO_SUDOKU_LEVEL] = {
//     8, 1, 2, 7, 5, 3, 6, 4, 9,
//     9, 4, 3, 6, 8, 2, 1, 7, 5,
//     6, 7, 5, 4, 9, 1, 2, 8, 3,
//     1, 5, 4, 2, 3, 7, 8, 9, 6,
//     3, 6, 9, 8, 4, 5, 7, 2, 1,
//     2, 8, 7, 1, 6, 9, 5, 3, 4,
//     5, 2, 1, 9, 7, 4, 3, 6, 8,
//     4, 3, 8, 5, 2, 6, 9, 1, 7,
//     7, 9, 6, 3, 1, 8, 4, 5, 2};
// //
// XSLGAMESUDO_S_SUDO XslGameSudo_s_Sudo;
// /* Extern variables ----------------------------------------------------------*/
// /* Private function prototypes -----------------------------------------------*/
// /* Private functions ---------------------------------------------------------*/
// /**
//  * @brief   格式化打印
//  * @note    打印指定行列的数组
//  * @param   *pXslGameSudoS	---	数据指针
//  * 			mode			---	0-打印问题	1-打印答案 2-只打印数独不打印字符串
//  * @return  null
//  */
// static void XslGameSudo_FormatPrint(XSLGAMESUDO_S_SUDO * pXslGameSudoS, uint8_t mode)
// {
//     uint8_t i, j, k;
//     uint8_t * pbuf;
//     // 打印问题
//     if ((mode == 0) || (mode == 2)) {
//         if (mode == 0) {
//             printf("Sudo Questions:\n");
//         }
//         pbuf = (uint8_t *)pXslGameSudoS -> cells;
//         for (i = 0; i < XSLGAMESUDO_SUDOKU_LEVEL; i++) {
//             for (j = 0; j < XSLGAMESUDO_SUDOKU_LEVEL; j++) {
//                 printf("%2d", pbuf[i * XSLGAMESUDO_SUDOKU_LEVEL + j]);
//                 if (j == (XSLGAMESUDO_SUDOKU_LEVEL - 1))
//                     printf("\n");
//             }
//         }
//     }
//     // 打印答案
//     else if (mode == 1) {
//         if (pXslGameSudoS -> pAnswersCount == 0) {
//             printf("Sudo Processor : No Solution!\n");
//             return;
//         }
//         //
//         pbuf = pXslGameSudoS -> pOutBuf;
//         for (k = 0; k < pXslGameSudoS -> OutAnswersCount; k++) {
//             printf("Sudo Answers(%d):\n", k + 1);
//             for (i = 0; i < XSLGAMESUDO_SUDOKU_LEVEL; i++) {
//                 for (j = 0; j < XSLGAMESUDO_SUDOKU_LEVEL; j++) {
//                     printf("%2d", pbuf[(k * XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL) + (i * XSLGAMESUDO_SUDOKU_LEVEL + j)]);
//                     if (j == (XSLGAMESUDO_SUDOKU_LEVEL - 1))
//                         printf("\n");
//                 }
//             }
//         }
//         if (pXslGameSudoS -> pAnswersCount != NULL) {
//             printf("Sudo Answers Count: %d\n", * (pXslGameSudoS -> pAnswersCount));
//         }
//     }
// }

// /**
//  * @brief   寻找下一个未填充的单元
//  * @note    寻找下一个未填充的单元
//  * @param   buf			---	输入输出	---	数据
//  * 			startrow	---	输入		---	查找起始行,此函数用于优化计算速度
//  * 			*row		---
//  * 			*col		---
//  * @return  0-没有空单元	1-有空单元
//  */
// static uint8_t XslGameSudo_findNextEmpty(XSLGAMESUDO_S_SUDO *pXslGameSudoS, int startrow, uint8_t *row, uint8_t *col)
// {
// 	uint8_t i, j;

// 	for (i = startrow; i < XSLGAMESUDO_SUDOKU_LEVEL; i++)
// 	{
// 		for (j = 0; j < XSLGAMESUDO_SUDOKU_LEVEL; j++)
// 		{
// 			if (pXslGameSudoS->cells[i][j] == 0)
// 			{
// 				*row = i;
// 				*col = j;
// 				return OK;
// 			}
// 		}
// 	}
// 	return ERR;
// }
// /**
//  * @brief   寻找下一个未填充的单元
//  * @note    寻找下一个未填充的单元
//  * @param   arr
//  * 			row
//  * 			col
//  * @return  0-没有符合规则的算法	1-已经填入符合规则的数据
//  */
// static int XslGameSudo_Cal(XSLGAMESUDO_S_SUDO * pXslGameSudoS, uint8_t row, uint8_t col)
// {
//     uint8_t i = 0, j = 0, n = 0;
//     uint8_t next_row = 0, next_col = 0;
//     while (1) {
//         //-----------------------1,向空单元填数
//         next_num:
//         // 填充失败判断-->尝试填充1-9都失败
//         ++n;
//         if (n >= (XSLGAMESUDO_SUDOKU_LEVEL + 1)) {
//             break;
//         }
//         // 填充违规判断--1-->判断行重复
//         for (j = 0; j < XSLGAMESUDO_SUDOKU_LEVEL; j++) {
//             if (pXslGameSudoS -> cells[row][j] == n) {
//                 goto next_num;
//             }
//         }

//         // 填充违规判断--2-->判断列重复
//         for (i = 0; i < XSLGAMESUDO_SUDOKU_LEVEL; i++) {
//             if (pXslGameSudoS -> cells[i][col] == n) {
//                 goto next_num;
//             }
//         }

//         // 填充违规判断--3-->判断所在小九宫格重复
//         uint8_t x = (row / 3) * 3;
//         uint8_t y = (col / 3) * 3;
//         for (i = x; i < x + 3; i++) {
//             for (j = y; j < y + 3; j++) {
//                 if (pXslGameSudoS -> cells[i][j] == n) {
//                     goto next_num;
//                 }
//             }
//         }

//         //填充确认-->可以填充
//         pXslGameSudoS -> cells[row][col] = n;
//         //-----------------------2,寻找下一个空单元
//         //如果9宫格已填满
//         if (ERR == XslGameSudo_findNextEmpty(pXslGameSudoS, row, & next_row, & next_col)) {
//             pXslGameSudoS -> OutAnswersCount=1;
//             return OK;
//         }
//         //-----------------------3,向下一个空单元填数
//         if (ERR == XslGameSudo_Cal(pXslGameSudoS, next_row, next_col)) {
//             pXslGameSudoS -> cells[row][col] = 0;
//             continue;
//         }
//         else {
//             return OK;
//         }
//     }
//     // 失败
//     return ERR;
// }
// /**
//  * @brief   数独解析
//  * @note    数独解析，计算的结果都包含在参数结构体里，所以并没有返回值。
//  * @param   *pXslGameSudoS	---	数独结构体指针
//  * @return  null
//  */
// void XslGameSudo_Processor(XSLGAMESUDO_S_SUDO * pXslGameSudoS)
// {
//     uint8_t row, col;
//     //初始化
//     XslGameSudo_findNextEmpty(pXslGameSudoS, 0, & row, & col);
//     pXslGameSudoS -> OutAnswersCount = 0;
//     if (pXslGameSudoS -> pAnswersCount != NULL) {
// 		* (pXslGameSudoS -> pAnswersCount) = 0;
//     }
//     //计算
//     XslGameSudo_Cal(pXslGameSudoS, row, col);
// }


// uint8_t XslGameSudo_Generate(XSLGAMESUDO_S_SUDO * pXslGameSudoS)
// {
//     uint8_t num = 1;
//     // 生成种子数独
//     memcpy((uint8_t *)(pXslGameSudoS -> cells), (uint8_t *) & XslGameSudo_SudoGenerateBuf[0][0], XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL);
//     printf("%d,----------Seeds sudoku:\n", num++);
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     //----------
//     memcpy((uint8_t *)(pXslGameSudoS -> cells), (uint8_t *) & XslGameSudo_SudoGenerateBuf[0][0], XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL);
//     // 两数交换法
//     {
//         uint8_t commutation_data_1, commutation_data_2;
//         uint8_t i;
//         uint8_t * pbuf = pXslGameSudoS -> cells;
//         // 设定交换数
//         commutation_data_1 = 2;
//         commutation_data_2 = 8;
//         // 执行数据交换
//         for (i = 0; i < XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL; i++) {
//             if (pbuf[i] == commutation_data_1) {
//                 pbuf[i] = commutation_data_2;
//             }
//             else if (pbuf[i] == commutation_data_2) {
//                 pbuf[i] = commutation_data_1;
//             }
//             else {
//                 ;
//             }
//         }
//     }
//     printf("Point Exchange method sudoku(point:2,8):\n");
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     //----------
//     memcpy((uint8_t *)(pXslGameSudoS -> cells), (uint8_t *) & XslGameSudo_SudoGenerateBuf[0][0], XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL);
//     printf("%d,----------Seeds sudoku:\n", num++);
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     // 非跨界行交换
//     {
//         uint8_t commutation_row_1, commutation_row_2;
//         uint8_t i, temp;
//         // 设定交换行(0-8有效)
//         commutation_row_1 = 0;
//         commutation_row_2 = 2;
//         // 执行交换行
//         for (i = 0; i < XSLGAMESUDO_SUDOKU_LEVEL; i++) {
//             temp = pXslGameSudoS -> cells[commutation_row_1][i];
//             pXslGameSudoS -> cells[commutation_row_1][i] = pXslGameSudoS -> cells[commutation_row_2][i];
//             pXslGameSudoS -> cells[commutation_row_2][i] = temp;
//         }
//     }
//     printf("Row Exchange method sudoku(row:1,3):\n");
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     //----------
//     memcpy((uint8_t *)(pXslGameSudoS -> cells), (uint8_t *) & XslGameSudo_SudoGenerateBuf[0][0], XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL);
//     printf("%d,----------Seeds sudoku:\n", num++);
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     // 非跨界列交换
//     {
//         uint8_t commutation_col_1, commutation_col_2;
//         uint8_t i, temp;
//         // 设定交换行(0-8有效)
//         commutation_col_1 = 0;
//         commutation_col_2 = 2;
//         // 执行交换行
//         for (i = 0; i < XSLGAMESUDO_SUDOKU_LEVEL; i++) {
//             temp = pXslGameSudoS -> cells[i][commutation_col_1];
//             pXslGameSudoS -> cells[i][commutation_col_1] = pXslGameSudoS -> cells[i][commutation_col_2];
//             pXslGameSudoS -> cells[i][commutation_col_2] = temp;
//         }
//     }
//     printf("Col Exchange method sudoku(col:1,3):\n");
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     //----------
//     memcpy((uint8_t *)(pXslGameSudoS -> cells), (uint8_t *) & XslGameSudo_SudoGenerateBuf[0][0], XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL);
//     printf("%d,----------Seeds sudoku:\n", num++);
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     // 块行交换
//     {
//         uint8_t commutation_blockrow_1, commutation_blockrow_2;
//         uint8_t i, j, temp;
//         // 设定交换行(0-2有效)
//         commutation_blockrow_1 = 0;
//         commutation_blockrow_2 = 1;
//         // 执行交换行
//         for (i = 0; i < XSLGAMESUDO_SUDOKU_LEVEL; i++) {
//             for (j = 0; j < 3; j++) {
//                 temp = pXslGameSudoS -> cells[commutation_blockrow_1 * 3 + j][i];
//                 pXslGameSudoS -> cells[commutation_blockrow_1 * 3 + j][i] = pXslGameSudoS -> cells[commutation_blockrow_2 * 3 + j][i];
//                 pXslGameSudoS -> cells[commutation_blockrow_2 * 3 + j][i] = temp;
//             }
//         }
//     }
//     printf("Block Row Exchange method sudoku(Block Row:1,2):\n");
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     //----------
//     memcpy((uint8_t *)(pXslGameSudoS -> cells), (uint8_t *) & XslGameSudo_SudoGenerateBuf[0][0], XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL);
//     printf("%d,----------Seeds sudoku:\n", num++);
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     // 块列交换
//     {
//         uint8_t commutation_blockrow_1, commutation_blockrow_2;
//         uint8_t i, j, temp;
//         // 设定交换行(0-2有效)
//         commutation_blockrow_1 = 0;
//         commutation_blockrow_2 = 1;
//         // 执行交换行
//         for (i = 0; i < XSLGAMESUDO_SUDOKU_LEVEL; i++) {
//             for (j = 0; j < 3; j++) {
//                 temp = pXslGameSudoS -> cells[i][commutation_blockrow_1 * 3 + j];
//                 pXslGameSudoS -> cells[i][commutation_blockrow_1 * 3 + j] = pXslGameSudoS -> cells[i][commutation_blockrow_2 * 3 + j];
//                 pXslGameSudoS -> cells[i][commutation_blockrow_2 * 3 + j] = temp;
//             }
//         }
//     }
//     printf("Block Col Exchange method sudoku(Block Col:1,2):\n");
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     //----------
//     memcpy((uint8_t *)(pXslGameSudoS -> cells), (uint8_t *) & XslGameSudo_SudoGenerateBuf[0][0], XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL);
//     printf("%d,----------Seeds sudoku:\n", num++);
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     // 矩阵旋转(下面是方形矩阵的自旋转程序(不用额外缓存))
//     {
//         uint8_t i, j, k, n, x;
//         uint8_t temp1, temp2;
//         //设置参数
//         n = XSLGAMESUDO_SUDOKU_LEVEL;
//         x = n / 2;
//         // 一圈一圈处理
//         k = n - 1;
//         for (i = 0; i < x; i++) {
//             for (j = 0; j < k; j++) {
//                 //右列
//                 temp1 = pXslGameSudoS -> cells[i + j][n - 1 - i];
//                 pXslGameSudoS -> cells[i + j][n - 1 - i] = pXslGameSudoS -> cells[i][i + j];
//                 //下行
//                 temp2 = pXslGameSudoS -> cells[n - 1 - i][n - 1 - i - j];
//                 pXslGameSudoS -> cells[n - 1 - i][n - 1 - i - j] = temp1;
//                 //左列
//                 temp1 = pXslGameSudoS -> cells[n - 1 - i - j][i];
//                 pXslGameSudoS -> cells[n - 1 - i - j][i] = temp2;
//                 //左上
//                 pXslGameSudoS -> cells[i][i + j] = temp1;
//             }
//             k -= 2;
//         }
//     }
//     printf("Rotate method sudoku(90 degrees):\n");
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     //----------
//     memcpy((uint8_t *)(pXslGameSudoS -> cells), (uint8_t *) & XslGameSudo_SudoGenerateBuf[0][0], XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL);
//     printf("%d,----------Seeds sudoku:\n", num++);
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     // 矩阵行镜像
//     {
//         uint8_t i, j;
//         uint8_t temp;
//         //
//         for (i = 0; i < XSLGAMESUDO_SUDOKU_LEVEL / 2; i++) {
//             for (j = 0; j < XSLGAMESUDO_SUDOKU_LEVEL; j++) {
//                 temp = pXslGameSudoS -> cells[j][XSLGAMESUDO_SUDOKU_LEVEL - 1 - i];
//                 pXslGameSudoS -> cells[j][XSLGAMESUDO_SUDOKU_LEVEL - 1 - i] = pXslGameSudoS -> cells[j][i];
//                 pXslGameSudoS -> cells[j][i] = temp;
//             }
//         }
//     }
//     printf("X Mirror sudoku:\n");
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     //----------
//     memcpy((uint8_t *)(pXslGameSudoS -> cells), (uint8_t *) & XslGameSudo_SudoGenerateBuf[0][0], XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL);
//     printf("%d,----------Seeds sudoku:\n", num++);
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     // 矩阵列镜像
//     {
//         uint8_t i, j;
//         uint8_t temp;
//         //
//         for (i = 0; i < XSLGAMESUDO_SUDOKU_LEVEL / 2; i++) {
//             for (j = 0; j < XSLGAMESUDO_SUDOKU_LEVEL; j++) {
//                 temp = pXslGameSudoS -> cells[XSLGAMESUDO_SUDOKU_LEVEL - 1 - i][j];
//                 pXslGameSudoS -> cells[XSLGAMESUDO_SUDOKU_LEVEL - 1 - i][j] = pXslGameSudoS -> cells[i][j];
//                 pXslGameSudoS -> cells[i][j] = temp;
//             }
//         }
//     }
//     printf("Y Mirror sudoku:\n");
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     //----------
//     memcpy((uint8_t *)(pXslGameSudoS -> cells), (uint8_t *) & XslGameSudo_SudoGenerateBuf[0][0], XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL);
//     printf("%d,----------Seeds sudoku:\n", num++);
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     // 矩阵对角线镜像
//     {
//         uint8_t i, j;
//         uint8_t temp;
//         for (i = 0; i < XSLGAMESUDO_SUDOKU_LEVEL - 1; i++) {
//             for (j = 0; j < XSLGAMESUDO_SUDOKU_LEVEL - 1 - i; j++) {
//                 temp = pXslGameSudoS -> cells[i + j + 1][i];
//                 pXslGameSudoS -> cells[i + j + 1][i] = pXslGameSudoS -> cells[i][i + j + 1];
//                 pXslGameSudoS -> cells[i][i + j + 1] = temp;
//             }
//         }
//     }
//     printf("Transpose sudoku:\n");
//     XslGameSudo_FormatPrint(pXslGameSudoS, 2);
//     //----------
// }
// /**
//  * @brief   main函数
//  * @note    主函数入口
//  * @param   null
//  * @return  null
//  */
// uint8_t MemBuf[1024]; //81个字节存储一组解,1024可以存储大于10个解
// uint32_t SudoCount;
// void main(int argc, char ** argv)
// {
//     uint8_t res;
//     uint32_t time1, time2;
//     printf("--------------------------------------------------\n");
//     printf("             XSL Sudo Generate(Normal)            \n");
//     printf("--------------------------------------------------\n");
//     XslGameSudo_Generate(& XslGameSudo_s_Sudo);
//     while (1);
//     printf("--------------------------------------------------\n");
//     printf("             XSL Sudo Processor(Normal)           \n");
//     printf("--------------------------------------------------\n");
//     // 数据载入
//     memcpy((uint8_t *)(XslGameSudo_s_Sudo.cells), (uint8_t *) & XslGameSudo_SudoBuf[0][0], XSLGAMESUDO_SUDOKU_LEVEL * XSLGAMESUDO_SUDOKU_LEVEL);
//     // 设置配置
//     //---最多解析10个解
//     XslGameSudo_s_Sudo.MaxOutAnswersCount = 5;
//     XslGameSudo_s_Sudo.pOutBuf = MemBuf;
//     XslGameSudo_s_Sudo.pAnswersCount = & SudoCount;
//     // 打印原始数独
//     XslGameSudo_FormatPrint(& XslGameSudo_s_Sudo, 0);
//     // 启动数独测试
//     time1 = GetTickCount();
//     XslGameSudo_Processor(& XslGameSudo_s_Sudo);
//     time2 = GetTickCount();
//     // 打印结果
//     XslGameSudo_FormatPrint(& XslGameSudo_s_Sudo, 1);
//     // 打印耗时
//     printf("Time(ms):%ld\n", time2 - time1);
//     // 定住页面,否则程序结束直接闪退,延时10秒自动退出
//     time1 = time2 = 0;
//     time1 = GetTickCount();
//     while (((time2 - time1) < 100000) || (time2 == 0)) {
//         time2 = GetTickCount();
//     }
// }