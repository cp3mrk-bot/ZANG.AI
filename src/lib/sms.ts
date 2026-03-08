/**
 * 短信服务模块
 * 支持阿里云短信服务
 */

interface SMSConfig {
  provider: 'aliyun' | 'tencent' | 'mock';
  // 阿里云配置
  accessKeyId?: string;
  accessKeySecret?: string;
  signName?: string;
  templateCode?: string;
  // 腾讯云配置
  secretId?: string;
  secretKey?: string;
  appId?: string;
}

// 从环境变量获取配置
function getSMSConfig(): SMSConfig {
  const provider = (process.env.SMS_PROVIDER || 'mock') as SMSConfig['provider'];
  
  if (provider === 'aliyun') {
    return {
      provider: 'aliyun',
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      signName: process.env.ALIYUN_SMS_SIGN_NAME || 'ZANG爱',
      templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE,
    };
  }
  
  if (provider === 'tencent') {
    return {
      provider: 'tencent',
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
      appId: process.env.TENCENT_SMS_APP_ID,
      signName: process.env.TENCENT_SMS_SIGN_NAME || 'ZANG爱',
      templateCode: process.env.TENCENT_SMS_TEMPLATE_CODE,
    };
  }
  
  return { provider: 'mock' };
}

/**
 * 发送短信验证码 - 阿里云
 */
async function sendAliyunSMS(phone: string, code: string, config: SMSConfig): Promise<{ success: boolean; error?: string }> {
  if (!config.accessKeyId || !config.accessKeySecret) {
    return { success: false, error: '阿里云短信服务未配置' };
  }

  try {
    // 动态导入阿里云SDK（仅在需要时加载）
    // @ts-ignore - 可选依赖
    const Core = await import('@alicloud/pop-rpc').catch(() => null);
    
    if (!Core) {
      return { success: false, error: '阿里云SDK未安装，请运行: pnpm add @alicloud/pop-rpc' };
    }
    
    const client = new Core.default({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: 'https://dysmsapi.aliyuncs.com',
      apiVersion: '2017-05-25'
    });

    const params = {
      PhoneNumbers: phone,
      SignName: config.signName,
      TemplateCode: config.templateCode,
      TemplateParam: JSON.stringify({ code }),
    };

    const result = await client.request('SendSms', params, { method: 'POST' });
    
    if (result.Code === 'OK') {
      return { success: true };
    } else {
      console.error('Aliyun SMS error:', result);
      return { success: false, error: result.Message || '发送失败' };
    }
  } catch (error: any) {
    console.error('Aliyun SMS error:', error);
    return { success: false, error: error.message || '短信发送失败' };
  }
}

/**
 * 发送短信验证码 - 腾讯云
 */
async function sendTencentSMS(phone: string, code: string, config: SMSConfig): Promise<{ success: boolean; error?: string }> {
  if (!config.secretId || !config.secretKey || !config.appId) {
    return { success: false, error: '腾讯云短信服务未配置' };
  }

  try {
    // 动态导入腾讯云SDK
    // @ts-ignore - 可选依赖
    const tencentcloud = await import('tencentcloud-sdk-nodejs').catch(() => null);
    
    if (!tencentcloud) {
      return { success: false, error: '腾讯云SDK未安装，请运行: pnpm add tencentcloud-sdk-nodejs' };
    }
    
    const smsClient = tencentcloud.sms.v20210111.Client;
    
    const client = new smsClient({
      credential: {
        secretId: config.secretId,
        secretKey: config.secretKey,
      },
      region: 'ap-guangzhou',
      profile: {
        httpProfile: {
          endpoint: 'sms.tencentcloudapi.com',
        },
      },
    });

    const params = {
      PhoneNumberSet: [`+86${phone}`],
      SmsSdkAppId: config.appId,
      SignName: config.signName!,
      TemplateId: config.templateCode!,
      TemplateParamSet: [code, '5'], // 验证码, 有效期(分钟)
    };

    const result = await client.SendSms(params);
    
    if (result.SendStatusSet?.[0]?.Code === 'Ok') {
      return { success: true };
    } else {
      console.error('Tencent SMS error:', result);
      return { success: false, error: result.SendStatusSet?.[0]?.Message || '发送失败' };
    }
  } catch (error: any) {
    console.error('Tencent SMS error:', error);
    return { success: false, error: error.message || '短信发送失败' };
  }
}

/**
 * Mock短信服务（开发环境）
 */
async function sendMockSMS(phone: string, code: string): Promise<{ success: boolean; error?: string; devCode?: string }> {
  console.log(`[MOCK SMS] 发送验证码到 ${phone}: ${code}`);
  return { 
    success: true, 
    devCode: process.env.NODE_ENV === 'development' ? code : undefined 
  };
}

/**
 * 发送短信验证码（统一入口）
 */
export async function sendVerificationCode(phone: string, code: string): Promise<{ 
  success: boolean; 
  error?: string;
  devCode?: string;
}> {
  const config = getSMSConfig();
  
  switch (config.provider) {
    case 'aliyun':
      return sendAliyunSMS(phone, code, config);
    case 'tencent':
      return sendTencentSMS(phone, code, config);
    default:
      return sendMockSMS(phone, code);
  }
}

/**
 * 检查短信服务是否已配置
 */
export function isSMSConfigured(): boolean {
  const config = getSMSConfig();
  return config.provider !== 'mock';
}
